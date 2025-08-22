import FooterButton from '@/components/FooterButton';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, Image, PanResponder, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

const cover = require('../../assets/images/undrawhappy.png');

type Point = { x: number; y: number };
type Stroke = { id: string; color: string; width: number; points: Point[] };

const { width: SCREEN_W } = Dimensions.get("window");
const CANVAS_MARGIN = 16;
const BG_COLOR = "#FFFFFF";         
const INK_COLOR = "#111827";       
const ERASE_COLOR = BG_COLOR;      
const DEFAULT_WIDTH = 6;

const toSvgPath = (pts: Point[]) => {
  if (pts.length === 0) return "";
  if (pts.length === 1) {
    const p = pts[0];
    return `M ${p.x} ${p.y} L ${p.x + 0.01} ${p.y + 0.01}`;
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
};

const index = () => {
  const { letter } = useLocalSearchParams<{ letter?: string }>();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(INK_COLOR);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isEraser, setIsEraser] = useState(false);
  const [mute, setMute] = React.useState(false);
  const [iscolorselect, setIsColorSelect] = React.useState(false);

  const canvasSize = useMemo(() => (SCREEN_W - CANVAS_MARGIN * 2)*0.8, []);

  const currentStroke = useRef<Stroke | null>(null);
  const colors = ["#111827", "#F59E0B", "#ED7E2D", "#10B981", "#3B82F6"];
  const router = useRouter();
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const stroke: Stroke = {
          id: `${Date.now()}`,
          color: isEraser ? ERASE_COLOR : color,
          width: isEraser ? DEFAULT_WIDTH * 3 : width, // Make eraser wider
          points: [{ x: locationX, y: locationY }],
        };
        currentStroke.current = stroke;
        setStrokes((prev) => [...prev, stroke]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        if (!currentStroke.current) return;
        const s = currentStroke.current;
        const updated: Stroke = {
          ...s,
          points: [...s.points, { x: locationX, y: locationY }],
        };
        currentStroke.current = updated;
        setStrokes((prev) => {
          const copy = prev.slice();
          copy[copy.length - 1] = updated;
          return copy;
        });
      },
      onPanResponderRelease: () => {
        currentStroke.current = null;
      },
      onPanResponderTerminate: () => {
        currentStroke.current = null;
      },
    })
  ).current;

  const undo = () => setStrokes((prev) => prev.slice(0, -1));
  const clear = () => setStrokes([]);

  const handleColorSelect = (selectedColor: string) => {
    setColor(selectedColor);
    setIsEraser(false); 
    setIsColorSelect(false);
  };

  

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={() => setIsColorSelect(false)}>
        <View style={styles.container}>
          <View style={styles.imgContainer}>
            <Image source={cover} style={styles.coverImg} />
          </View>

          <View
            style={[
              styles.canvasWrapper,
              {
                width: canvasSize,
                height: canvasSize,
                backgroundColor: BG_COLOR,
              },
            ]}
          >
            <Svg width="100%" height="100%" {...panResponder.panHandlers}>
              <Rect x={0} y={0} width="100%" height="100%" fill={BG_COLOR} />
              {/* faint letter as background */}
              <SvgText
                x="50%"
                y="50%"
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize={canvasSize / 2}
                fill="#E5E7EB"
              >
                {letter}
              </SvgText>

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
            <Text style={styles.mainletter}>{letter}</Text>
            <Text style={styles.secondset}>LET'S WRITE</Text>
          </View>

          {/* Color palette positioned above footer */}
          {iscolorselect && (
            <View style={styles.colorOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.colorPaletteContainer}>
                  <View style={styles.colorPalette}>
                    {colors.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorBall,
                          {
                            backgroundColor: c,
                            borderColor: color === c ? "#000" : "#ccc",
                            borderWidth: color === c ? 3 : 1,
                          },
                        ]}
                        onPress={() => handleColorSelect(c)}
                      />
                    ))}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          )}
          {/* Test */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/mission/voice",
                params: { letter },
              })
            }
          >
            <Text>Next</Text>
          </TouchableOpacity>
          <View style={styles.footerContainer}>
            <FooterButton
              setMute={setMute}
              mute={mute}
              setIsColorSelect={setIsColorSelect}
              setIsEraser={setIsEraser}
              isEraser={isEraser}
              undo={undo}
              clear={clear}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 16,
    flex: 1,
    position: 'relative',
  },
  root: { flex: 1, backgroundColor: "#FFF", padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#222" },
  canvasWrapper: {
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,

    // Android shadow
    elevation: 6,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionText: { color: "#FFF", fontWeight: "700" },

  imgContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  coverImg: {
    bottom: 0,
    right: 0,
    paddingRight: 16,
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  letterContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    flex: 1,
  },
  mainletter: {
    fontSize: 128,
    color: "#ED7E2D",
    fontWeight: "900",
    fontFamily: "Poppins-ExtraLight",
  },
  secondset: {
    color: "#F59E0B",
    fontFamily: "Popins-Regular",
    fontSize: 24,
  },
  footerContainer: {
    position: 'relative',
    width:'100%',
    display:'flex',
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center'
  },
  colorOverlay: {
    position: "absolute",
    bottom: 70, 
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  colorPaletteContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  colorPalette: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    gap: 12,
    
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,

    // Android shadow
    elevation: 5,
  },
  colorBall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
});