import FooterButton from '@/components/FooterButton';
import { useMarks } from '@/context/MarksContext';
import { MissionContext } from '@/context/MissionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { useAudioPlayer } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import TFLiteModelHandler, { TFLiteResult } from '../../components/TFLiteModelHandler';

const cover = require('../../assets/images/undrawhappy.png');
const gameover = require('../../assets/images/gameover.png');
const sucess = require('../../assets/images/sucess.png');

type Point = { x: number; y: number };
type Stroke = { id: string; color: string; width: number; points: Point[] };

interface PredictionResult {
  passed: boolean;
  points: number;
  modelType: string;
  processingTime: number;
}

const { width: SCREEN_W } = Dimensions.get("window");
const BG_COLOR = "#FFFFFF";         
const INK_COLOR = "#000000";       
const ERASE_COLOR = BG_COLOR;      
const CANVAS_SIZE = 500;
const STROKE_WIDTH = 40;       
const DRAWING_TIME_LIMIT = 12;  

const toSvgPath = (pts: Point[]) => {
  if (!pts.length) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.01} ${pts[0].y + 0.01}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  return d;
};

const DrawingScreen = () => {
  const { letter } = useLocalSearchParams<{ letter?: string }>();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(INK_COLOR);
  const [width, setWidth] = useState(STROKE_WIDTH);
  const [isEraser, setIsEraser] = useState(false);
  const [mute, setMute] = useState(false);
  const [iscolorselect, setIsColorSelect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DRAWING_TIME_LIMIT);
  const [isDrawing, setIsDrawing] = useState(false);
  const [modelHandler] = useState(() => new TFLiteModelHandler());
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const canvasRef = useRef(null);
  const timerRef = useRef<any>(null);
  const currentStroke = useRef<Stroke | null>(null);
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const { missions, setMissions } = React.useContext(MissionContext);
  const { marks, addScore } = useMarks();

  const sucessAudio = useAudioPlayer(require("../../assets/sounds/success.wav"));
  const failAudio = useAudioPlayer(require("../../assets/sounds/fail.wav"));

  const colors = ["#000000", "#F59E0B", "#ED7E2D", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444"];

  // Initialize TF model
  useEffect(() => {
    const init = async () => {
      await tf.ready();
      await modelHandler.loadTFLiteModel('../../assets/models/letters_fp32.tflite');
    };
    init();
    return () => modelHandler.dispose();
  }, []);

  // Timer
  useEffect(() => {
    if (isDrawing && timeLeft > 0)
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    else if (timeLeft === 0 && isDrawing) handleAutoCapture();
    return () => clearTimeout(timerRef.current);
  }, [isDrawing, timeLeft]);

  useEffect(() => {
    if (showResult) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.bounce,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [showResult]);

  const startDrawingSession = useCallback(() => {
    setIsDrawing(true);
    setTimeLeft(DRAWING_TIME_LIMIT);
    setResult(null);
    setShowResult(false);
  }, []);

  const handleAutoCapture = useCallback(async () => {
    if (!canvasRef.current || !strokes.length) { Alert.alert('Draw something first!'); return; }
    setIsDrawing(false);
    setIsProcessing(true);

    const startTime = Date.now();
    try {
      const base64Data = await captureRef(canvasRef.current, { format: 'png', quality: 1.0, result: 'base64', width: CANVAS_SIZE, height: CANVAS_SIZE });
      const prediction: TFLiteResult = await modelHandler.predict(base64Data);
      const processingTime = Date.now() - startTime;
      const passed = prediction.confidence >= 0.75;
      const points = Math.round(prediction.confidence * 100);
      const finalResult: PredictionResult = { passed, points, modelType: 'TFLite', processingTime };
      
      setResult(finalResult);
      setShowResult(true);

      if (letter) {
        const upperLetter = letter.toUpperCase();

        if (passed) {
          // 1. Add draw marks if not already added
          const markEntry = marks.find(m => m.letter === upperLetter && m.mission === 'draw');
          if (!markEntry?.completed) {
            await addScore(upperLetter, 'draw', 50); // 50 points for draw
          }

          // 2. Update MissionContext for draw
          const updatedMissions = [...missions];
          updatedMissions.forEach(m => {
            if (m.letter === upperLetter && m.mission === 'draw') m.completed = true;
          });

          // 3. Unlock next letter only if both draw + voice completed
          const letterMissions = updatedMissions.filter(m => m.letter === upperLetter);
          const allCompleted = letterMissions.every(m => m.completed);
          if (allCompleted) {
            const nextIndex = updatedMissions.findIndex(m => m.letter === upperLetter) + letterMissions.length;
            if (nextIndex < updatedMissions.length && !updatedMissions[nextIndex].unlocked) {
              updatedMissions[nextIndex].unlocked = true;
            }
          }
          setMissions(updatedMissions);
          await AsyncStorage.setItem('missions', JSON.stringify(updatedMissions));

          sucessAudio.play();
          setTimeout(() => router.push({ pathname: "/mission/voice", params: { letter: upperLetter } }), 1500);
        } else {
          failAudio.play();
        }
      }
    } catch (error) {
      console.error('Error capturing/predicting:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [strokes, modelHandler, letter, marks, addScore, missions]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      if (!isDrawing && !showResult) startDrawingSession();
      const { locationX, locationY } = evt.nativeEvent;
      const stroke: Stroke = { id: `${Date.now()}`, color: isEraser ? ERASE_COLOR : color, width: isEraser ? STROKE_WIDTH*1.5 : STROKE_WIDTH, points: [{ x: locationX, y: locationY }] };
      currentStroke.current = stroke; setStrokes(prev => [...prev, stroke]);
    },
    onPanResponderMove: (evt) => {
      if (!currentStroke.current) return;
      const { locationX, locationY } = evt.nativeEvent;
      const updated: Stroke = { ...currentStroke.current, points: [...currentStroke.current.points, { x: locationX, y: locationY }] };
      currentStroke.current = updated;
      setStrokes(prev => { const copy = prev.slice(); copy[copy.length-1] = updated; return copy; });
    },
    onPanResponderRelease: () => { currentStroke.current = null; },
  })).current;

  const undo = () => setStrokes(prev => prev.slice(0, -1));
  const clear = () => { setStrokes([]); setIsDrawing(false); setTimeLeft(DRAWING_TIME_LIMIT); setResult(null); setShowResult(false); };
  const handleColorSelect = (c: string) => { setColor(c); setIsEraser(false); setIsColorSelect(false); };
  const handleEraser = () => { setIsEraser(!isEraser); setIsColorSelect(false); };
  const resetSession = () => { clear(); setShowResult(false); };
  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <ScrollView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={() => setIsColorSelect(false)}>
        <View style={styles.container}>
          <View style={styles.imgContainer}><Image source={cover} style={styles.coverImg} /></View>

          {isDrawing && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
          )}
          {isProcessing && (
            <View style={styles.processingContainer}>
              <Text style={styles.processingText}>Analyzing letter...</Text>
            </View>
          )}

          <View
            ref={canvasRef}
            style={[styles.canvasWrapper, { width: CANVAS_SIZE, height: CANVAS_SIZE, backgroundColor: BG_COLOR }]}
          >
            <Svg width="100%" height="100%" {...panResponder.panHandlers}>
              <Rect x={0} y={0} width="100%" height="100%" fill={BG_COLOR} />
              {strokes.map((s) => (
                <Path
                  key={s.id}
                  d={toSvgPath(s.points)}
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
            </Svg>
          </View>

          <View style={styles.letterContainer}>
            <Text style={styles.mainletter}>{letter?.toUpperCase()}</Text>
            <Text style={styles.secondset}>DRAW THE LETTER</Text>
          </View>

          {showResult && result && (
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}
              >
                <Image source={result.passed ? sucess : gameover} style={styles.popupImage} resizeMode="contain" />
                <Text style={styles.childPopupText}>
                  {result.passed ? "Awesome! You drew it perfectly!" : "Oops! Try again!"}
                </Text>
                {!result.passed && (
                  <TouchableOpacity style={styles.tryAgainBtn} onPress={resetSession}>
                    <Text style={styles.tryAgainText}>Try Again</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </View>
          )}

          <View style={styles.footerContainer}>
            <FooterButton setMute={setMute} mute={mute} isEraser={isEraser} undo={undo} clear={clear} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
};

export default DrawingScreen;

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", padding: 16, flex: 1, position: "relative" },
  canvasWrapper: { alignSelf: "center", borderRadius: 16, overflow: "hidden", borderWidth: 2, borderColor: "#E5E7EB", marginVertical: 8 },
  popupImage: { width: 120, height: 120, marginBottom: 20 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
  modalContent: { width: '80%', backgroundColor: '#FFB347', padding: 32, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  childPopupText: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  tryAgainBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 25 },
  tryAgainText: { color: '#fff', fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
  imgContainer: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  coverImg: { width: 180, height: 180, resizeMode: "contain" },
  letterContainer: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", paddingVertical: 16 },
  mainletter: { fontSize: 96, color: "#ED7E2D", fontWeight: "900", fontFamily: "monospace" },
  secondset: { color: "#F59E0B", fontSize: 20, fontWeight: "600", marginBottom: 8 },
  timerContainer: { alignSelf: "center", backgroundColor: "#F59E0B", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 8 },
  timerText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  processingContainer: { alignSelf: "center", backgroundColor: "#3B82F6", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 8 },
  processingText: { color: "#fff", fontWeight: "bold", fontSize: 14, textAlign: "center" },
  footerContainer: { position: "relative", width: "100%", display: "flex", justifyContent: "center", alignContent: "center", alignItems: "center", marginTop: 8 }
});
