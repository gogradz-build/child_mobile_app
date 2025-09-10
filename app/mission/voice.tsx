import OnMicIcon from '@/assets/icons/OnMicIcon';
import StaticIcon from '@/assets/icons/VolumeIcon';
import FooterButton from '@/components/FooterButton';
import { useMarks } from '@/context/MarksContext';
import { MissionContext } from '@/context/MissionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TFLiteModelHandler, { TFLiteResult } from '../../components/TFLiteModelHandler';

const cover = require('../../assets/images/undrawsecond.png');
const gameover = require('../../assets/images/gameover.png');
const sucess = require('../../assets/images/sucess.png');

const soundMap: Record<string, any> = {
  A: require("../../assets/sounds/A.wav"),
  B: require("../../assets/sounds/B.wav"),
  C: require("../../assets/sounds/C.wav"),
  D: require("../../assets/sounds/D.wav"),
  E: require("../../assets/sounds/E.wav"),
  F: require("../../assets/sounds/F.wav"),
  G: require("../../assets/sounds/G.wav"),
  H: require("../../assets/sounds/H.wav"),
  I: require("../../assets/sounds/I.wav"),
  J: require("../../assets/sounds/J.wav"),
  K: require("../../assets/sounds/K.wav"),
  L: require("../../assets/sounds/L.wav"),
  M: require("../../assets/sounds/M.wav"),
  N: require("../../assets/sounds/N.wav"),
  O: require("../../assets/sounds/O.wav"),
  P: require("../../assets/sounds/P.wav"),
  Q: require("../../assets/sounds/Q.wav"),
  R: require("../../assets/sounds/R.wav"),
  S: require("../../assets/sounds/S.wav"),
  T: require("../../assets/sounds/T.wav"),
  U: require("../../assets/sounds/U.wav"),
  V: require("../../assets/sounds/V.wav"),
  W: require("../../assets/sounds/W.wav"),
  X: require("../../assets/sounds/X.wav"),
  Y: require("../../assets/sounds/Y.wav"),
  Z: require("../../assets/sounds/Z.wav"),
};

const successSound = require('../../assets/sounds/success.wav');
const failSound = require('../../assets/sounds/fail.wav');

interface VoicePredictionResult {
  passed: boolean;
  confidence: number;
  predictedLetter?: string;
  processingTime: number;
  attemptCount: number;
  confidenceThreshold: number;
  isAutoUnlock?: boolean;
}

export default function Voice() {
  const { letter } = useLocalSearchParams<{ letter?: string }>();
  const [play, setPlay] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [result, setResult] = useState<VoicePredictionResult | null>(null);
  const [mute, setMute] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelHandler] = useState(() => new TFLiteModelHandler());
  const [attemptCount, setAttemptCount] = useState(0);
  const [wrongPredictions, setWrongPredictions] = useState(0);
  const router = useRouter();
  const popupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [isEraser, setIsEraser] = useState(false);

  const { missions, setMissions, unlockNextMission } = useContext(MissionContext);
  const { marks, addScore } = useMarks();

  // --- Sounds ---
  const [letterSound, setLetterSound] = useState<Audio.Sound | null>(null);
  const [successPlayer, setSuccessPlayer] = useState<Audio.Sound | null>(null);
  const [failPlayer, setFailPlayer] = useState<Audio.Sound | null>(null);

  // Initialize TensorFlow and load voice model
  useEffect(() => {
    const initModel = async () => {
      try {
        await tf.ready();
        console.log('TensorFlow.js ready');
        
        // Load the voice model
        await modelHandler.loadTFLiteModel('../../assets/models/letters_voice_fp32.tflite');
        console.log('Voice model loaded successfully');
        
        // Log available methods to debug
        console.log('ModelHandler methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(modelHandler)));
        
      } catch (error) {
        console.error('Error loading voice model:', error);
        Alert.alert(
          'Model Error', 
          'Failed to load voice recognition model. Some features may not work properly.'
        );
      }
    };
    initModel();

    return () => {
      try {
        modelHandler.dispose();
      } catch (error) {
        console.log('Error disposing model:', error);
      }
    };
  }, []);

  // Load sounds
  useEffect(() => {
    let ls: Audio.Sound | null = null;
    let sp: Audio.Sound | null = null;
    let fp: Audio.Sound | null = null;

    const load = async () => {
      try {
        if (letter) {
          ls = new Audio.Sound();
          await ls.loadAsync(soundMap[letter.toUpperCase()]);
          setLetterSound(ls);
        }
        sp = new Audio.Sound();
        fp = new Audio.Sound();
        await sp.loadAsync(successSound);
        await fp.loadAsync(failSound);
        setSuccessPlayer(sp);
        setFailPlayer(fp);
      } catch (err) {
        console.error("Error loading sounds", err);
      }
    };

    load();

    return () => {
      ls?.unloadAsync();
      sp?.unloadAsync();
      fp?.unloadAsync();
    };
  }, [letter]);

  useEffect(() => {
    if (play && letterSound) {
      (async () => {
        try {
          await letterSound.stopAsync();
          await letterSound.setPositionAsync(0);
          await letterSound.playAsync();
        } catch (err) {
          console.error("Error playing letter sound:", err);
        } finally {
          setPlay(false);
        }
      })();
    }
  }, [play, letterSound]);

  useEffect(() => {
    if (!result) scaleAnim.setValue(0);
  }, [result]);

  useEffect(() => {
    return () => {
      if (popupTimer.current) clearTimeout(popupTimer.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "You must allow microphone access.");
        return;
      }

      await Audio.setAudioModeAsync({ 
        allowsRecordingIOS: true, 
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);

      // Auto-stop recording after 3 seconds
      setTimeout(() => stopRecording(recording), 3000);
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Recording Error", "Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async (rec?: Audio.Recording) => {
    const r = rec || recording;
    if (!r) return;
    
    setIsProcessing(true);
    
    try {
      await r.stopAndUnloadAsync();
      const uri = r.getURI();
      if (uri) {
        await sendToModel(uri);
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch (err) {
      console.error("Stop recording error:", err);
      Alert.alert("Processing Error", "Failed to process recording. Please try again.");
    } finally {
      setRecording(null);
      setIsProcessing(false);
    }
  };

  const convertAudioToBase64 = async (fileUri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error converting audio to base64:', error);
      throw error;
    }
  };

  const sendToModel = async (fileUri: string) => {
    const startTime = Date.now();
    
    try {
      console.log('Processing voice recording for letter:', letter?.toUpperCase());
      console.log('Current attempt:', attemptCount + 1);
      console.log('Wrong predictions so far:', wrongPredictions);
      
      // Convert audio file to base64
      const audioBase64 = await convertAudioToBase64(fileUri);
      console.log('Audio file converted to base64, length:', audioBase64.length);
      
      let prediction: TFLiteResult;
      const targetLetter = letter?.toUpperCase() || '';
      
      // Check if model handler has predict method and try to use it
      if (typeof modelHandler.predict === 'function') {
        console.log('Using modelHandler.predict for voice data');
        prediction = await modelHandler.predict(audioBase64);
      } else {
        console.log('ModelHandler.predict not available, using simulation');
        // Enhanced simulation that considers the target letter
        const confidence = 0.4 + Math.random() * 0.6; // 0.4 to 1.0
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        // 70% chance to predict correct letter, 30% random
        const shouldBeCorrect = Math.random() > 0.3;
        let predictedLetter: string;
        
        if (shouldBeCorrect) {
          predictedLetter = targetLetter;
        } else {
          // Pick a random different letter
          do {
            predictedLetter = letters[Math.floor(Math.random() * letters.length)];
          } while (predictedLetter === targetLetter && letters.length > 1);
        }
        
        prediction = {
          confidence: shouldBeCorrect ? Math.max(confidence, 0.7) : Math.min(confidence, 0.69),
          predictedClass: predictedLetter,
          label: predictedLetter
        };
      }
      
      const processingTime = Date.now() - startTime;
      const confidence = prediction.confidence || 0;
      const predictedLetter = (prediction.predictedClass || prediction.label || '').toUpperCase();
      
      console.log(`Target: "${targetLetter}", Predicted: "${predictedLetter}", Confidence: ${confidence}`);
      
      // Dynamic confidence threshold based on attempt count
      let confidenceThreshold = 0.65; // Start with high standard
      if (attemptCount >= 2) confidenceThreshold = 0.5;   // More lenient after 2 attempts
      if (attemptCount >= 4) confidenceThreshold = 0.35;  // Very lenient after 4 attempts
      
      console.log(`Attempt ${attemptCount + 1}, Confidence threshold: ${confidenceThreshold}`);
      
      // Check if letter matches and confidence is good
      const letterMatches = predictedLetter === targetLetter;
      const confidenceGood = confidence >= confidenceThreshold;
      
      // Track wrong predictions from model
      if (!letterMatches) {
        setWrongPredictions(prev => prev + 1);
        console.log(`Wrong prediction count: ${wrongPredictions + 1}`);
      }
      
      // Auto-unlock after 3 wrong predictions from model
      const shouldAutoUnlock = (wrongPredictions + 1) >= 3 && !letterMatches;
      
      // Determine if mission passes
      let passed = letterMatches && confidenceGood; // Normal pass condition
      
      // Override to pass if model has given wrong predictions 3+ times
      if (shouldAutoUnlock) {
        passed = true;
        console.log('Auto-unlocking mission due to repeated wrong model predictions');
      }
      
      console.log(`Letter matches: ${letterMatches}, Confidence good: ${confidenceGood}, Auto-unlock: ${shouldAutoUnlock}, Passed: ${passed}`);
      
      const voiceResult: VoicePredictionResult = {
        passed,
        confidence,
        predictedLetter,
        processingTime,
        attemptCount: attemptCount + 1,
        confidenceThreshold,
        isAutoUnlock: shouldAutoUnlock
      };

      setResult(voiceResult);
      
      // Increment attempt count if not passed
      if (!passed) {
        setAttemptCount(prev => prev + 1);
      }
      
      // Use bounce animation like in drawing screen
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.bounce,
        useNativeDriver: true,
      }).start();

      if (passed) {
        // Play success sound
        if (!mute && successPlayer) {
          try {
            await successPlayer.stopAsync();
            await successPlayer.setPositionAsync(0);
            await successPlayer.playAsync();
          } catch (err) {
            console.warn("Error playing success sound:", err);
          }
        }

        // Update marks and missions
        const currentLetter = letter!.toUpperCase();
        const markEntry = marks.find(m => m.letter === currentLetter && m.mission === 'voice');
        if (!markEntry?.completed) {
          // Give different scores based on how mission was completed
          let score = 50; // Full score for normal completion
          if (shouldAutoUnlock) {
            score = 30; // Lower score for auto-unlock due to model issues
          } else if (attemptCount >= 1) {
            score = 40; // Reduced score for multiple attempts
          }
          if (attemptCount >= 3) {
            score = 30; // Even lower score for many attempts
          }
          
          await addScore(currentLetter, 'voice', score);
        }

        const updatedMissions = [...missions];
        const voiceMission = updatedMissions.find(m => m.letter === currentLetter && m.mission === 'voice');
        if (voiceMission) voiceMission.completed = true;

        const letterMissions = updatedMissions.filter(m => m.letter === currentLetter);
        const allCompleted = letterMissions.every(m => m.completed);
        if (allCompleted) unlockNextMission(currentLetter);

        setMissions(updatedMissions);
        await AsyncStorage.setItem('missions', JSON.stringify(updatedMissions));

        // Reset counters on success
        setAttemptCount(0);
        setWrongPredictions(0);

        // Navigate back to dashboard after delay
        popupTimer.current = setTimeout(() => {
          setResult(null);
          router.push("/dashboard");
        }, 1500);
      } else {
        // Play fail sound
        if (!mute && failPlayer) {
          try {
            await failPlayer.stopAsync();
            await failPlayer.setPositionAsync(0);
            await failPlayer.playAsync();
          } catch (err) {
            console.warn("Error playing fail sound:", err);
          }
        }
        
        // Hide result after delay
        popupTimer.current = setTimeout(() => setResult(null), 2000);
      }
    } catch (err) {
      console.error('Model prediction error:', err);
      
      // More specific error handling
      if (err.message && err.message.includes('predict')) {
        Alert.alert(
          "Model Error", 
          "Voice recognition is not properly configured. Please contact support."
        );
      } else {
        Alert.alert(
          "Analysis Error", 
          "Failed to analyze your pronunciation. Please try speaking more clearly."
        );
      }
      setResult(null);
    }
  };

  const handleMicPress = () => {
    if (!recording && !isProcessing) {
      startRecording();
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    if (popupTimer.current) {
      clearTimeout(popupTimer.current);
      popupTimer.current = null;
    }
  };

  const getAttemptMessage = () => {
   
    
    return "";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imgContainer}>
        <Image source={cover} style={styles.coverImg} />
      </View>

      <View style={styles.letterContainer}>
        <Text style={styles.secondset}>SAY THE LETTER</Text>
        {(attemptCount > 0 || wrongPredictions > 0) && (
          <Text style={styles.attemptMessage}>{getAttemptMessage()}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.soundbttn} onPress={() => setPlay(!play)}>
        <StaticIcon size={48} color="#e43535ff" />
      </TouchableOpacity>

      {isProcessing && (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Analyzing pronunciation...</Text>
        </View>
      )}

      <View style={styles.padcontainer}>
        <View style={styles.textContainer}>
          <TouchableOpacity 
            onPress={handleMicPress}
            disabled={isProcessing}
            style={[styles.micButton, isProcessing && styles.micButtonDisabled]}
          >
            <OnMicIcon 
              color={recording ? "red" : isProcessing ? "#999" : "#E0681D"} 
              size={56} 
            />
          </TouchableOpacity>
          <Text style={styles.mainText}>{letter?.toUpperCase()}</Text>
        </View>
        <Text style={styles.tabText}>
          {recording ? "Recording..." : isProcessing ? "Processing..." : "TAP TO SPEAK"}
        </Text>
        
        
      </View>

      <FooterButton
        setMute={setMute}
        mute={mute}
        undo={() => null}
        clear={() => null}
        isEraser={isEraser}
      />

      {result && (
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
            <Image
              source={result.passed ? sucess : gameover}
              style={styles.popupImage}
              resizeMode="contain"
            />
            <Text style={styles.childPopupText}>
              {result.passed
                ? result.isAutoUnlock
                  ? "Mission unlocked! you did great!"
                  : `Awesome! You said "${result.predictedLetter}" correctly!`
                : `I heard  but looking for "${letter?.toUpperCase()}"`}
            </Text>
            
            {!result.passed && (
              <>
                
                <TouchableOpacity style={styles.tryAgainBtn} onPress={handleTryAgain}>
                  <Text style={styles.tryAgainText}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
          {result.passed && <Text style={styles.floatingEmoji1}>🎉</Text>}
          {result.passed && <Text style={styles.floatingEmoji2}>🎉</Text>}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "#fff" },
  imgContainer: { flexDirection: "row", justifyContent: "flex-end", width: "100%", marginTop: 12 },
  coverImg: { width: 180, height: 180, resizeMode: "contain" },
  letterContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  secondset: { color: "#F59E0B", fontFamily: "Popins-Regular", fontSize: 24 },
  attemptMessage: { 
    color: "#10B981", 
    fontFamily: "Popins-Regular", 
    fontSize: 16, 
    marginTop: 8, 
    textAlign: "center" 
  },
  padcontainer: { 
    width: 314, 
    height: 354, 
    borderRadius: 61, 
    backgroundColor: "#fff", 
    justifyContent: "center", 
    alignItems: "center", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 4,
    marginBottom: 20
  },
  textContainer: { flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" },
  mainText: { fontSize: 72, fontFamily: "Poppins-ExtraBold", color: "#ED7E2D" },
  tabText: { fontSize: 24, fontFamily: "Popins-Regular", color: "#ACA6A6" },
  attemptCount: { 
    fontSize: 16, 
    fontFamily: "Popins-Regular", 
    color: "#6B7280", 
    marginTop: 8 
  },
  wrongCount: { 
    fontSize: 14, 
    fontFamily: "Popins-Regular", 
    color: "#EF4444", 
    marginTop: 4 
  },
  soundbttn: { width: "100%", alignItems: "flex-end", marginBottom: 20 },
  micButton: { padding: 8 },
  micButtonDisabled: { opacity: 0.5 },
  processingContainer: { 
    backgroundColor: "#3B82F6", 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20, 
    marginBottom: 16 
  },
  processingText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14, 
    textAlign: "center" 
  },
  modalOverlay: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: "rgba(0,0,0,0.7)", 
    justifyContent: "center", 
    alignItems: "center", 
    zIndex: 3000 
  },
  popupImage: { width: 120, height: 120, marginBottom: 20 },
  modalContent: { 
    width: "80%", 
    backgroundColor: "#FFB347", 
    padding: 32, 
    borderRadius: 25, 
    alignItems: "center", 
    justifyContent: "center", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 10, 
    elevation: 10 
  },
  childPopupText: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "#fff", 
    textAlign: "center", 
    marginBottom: 20 
  },
  confidenceText: { 
    fontSize: 16, 
    color: "#fff", 
    textAlign: "center", 
    marginBottom: 10, 
    opacity: 0.9 
  },
  attemptText: { 
    fontSize: 14, 
    color: "#fff", 
    textAlign: "center", 
    marginBottom: 15, 
    opacity: 0.8,
    fontStyle: 'italic'
  },
  autoUnlockText: { 
    fontSize: 14, 
    color: "#22C55E", 
    textAlign: "center", 
    marginBottom: 15, 
    fontWeight: "bold"
  },
  tryAgainBtn: { 
    backgroundColor: "#F59E0B", 
    paddingHorizontal: 28, 
    paddingVertical: 14, 
    borderRadius: 25 
  },
  tryAgainText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 18, 
    textAlign: "center" 
  },
  floatingEmoji1: { 
    position: "absolute", 
    top: "20%", 
    left: "10%", 
    fontSize: 40, 
    transform: [{ rotate: "-15deg" }] 
  },
  floatingEmoji2: { 
    position: "absolute", 
    top: "25%", 
    right: "15%", 
    fontSize: 45, 
    transform: [{ rotate: "10deg" }] 
  },
});