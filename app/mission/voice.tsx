import OnMicIcon from '@/assets/icons/OnMicIcon';
import StaticIcon from '@/assets/icons/VolumeIcon';
import FooterButton from '@/components/FooterButton';
import { useMarks } from '@/context/MarksContext';
import { MissionContext } from '@/context/MissionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

export default function Voice() {
  const { letter } = useLocalSearchParams<{ letter?: string }>();
  const [play, setPlay] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [result, setResult] = useState<{ passed: boolean } | null>(null);
  const [mute, setMute] = useState(false);
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

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);

      setTimeout(() => stopRecording(recording), 4000);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async (rec?: Audio.Recording) => {
    const r = rec || recording;
    if (!r) return;
    try {
      await r.stopAndUnloadAsync();
      const uri = r.getURI();
      if (uri) await sendToModel(uri);
      await FileSystem.deleteAsync(uri!, { idempotent: true });
    } catch (err) {
      console.error("Stop recording error:", err);
    } finally {
      setRecording(null);
    }
  };

  const sendToModel = async (fileUri: string) => {
    try {
      const success = Math.random() > 0.5; // mock result

      setResult({ passed: success });
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

      if (success) {
        if (!mute && successPlayer) {
          await successPlayer.stopAsync();
          await successPlayer.setPositionAsync(0);
          await successPlayer.playAsync();
        }

        const currentLetter = letter!.toUpperCase();
        const markEntry = marks.find(m => m.letter === currentLetter && m.mission === 'voice');
        if (!markEntry?.completed) {
          await addScore(currentLetter, 'voice', 50);
        }

        const updatedMissions = [...missions];
        const voiceMission = updatedMissions.find(m => m.letter === currentLetter && m.mission === 'voice');
        if (voiceMission) voiceMission.completed = true;

        const letterMissions = updatedMissions.filter(m => m.letter === currentLetter);
        const allCompleted = letterMissions.every(m => m.completed);
        if (allCompleted) unlockNextMission(currentLetter);

        setMissions(updatedMissions);
        await AsyncStorage.setItem('missions', JSON.stringify(updatedMissions));

        popupTimer.current = setTimeout(() => {
          setResult(null);
          router.push("/dashboard");
        }, 1500);
      } else {
        if (!mute && failPlayer) {
          await failPlayer.stopAsync();
          await failPlayer.setPositionAsync(0);
          await failPlayer.playAsync();
        }
        popupTimer.current = setTimeout(() => setResult(null), 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMicPress = () => {
    if (!recording) startRecording();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.letterContainer}>
        <Text style={styles.secondset}>LET'S WRITE</Text>
      </View>

      <TouchableOpacity style={styles.soundbttn} onPress={() => setPlay(!play)}>
        <StaticIcon size={48} color="#e43535ff" />
      </TouchableOpacity>

      <View style={styles.padcontainer}>
        <View style={styles.textContainer}>
          <TouchableOpacity onPress={handleMicPress}>
            <OnMicIcon color={recording ? "red" : "#E0681D"} size={56} />
          </TouchableOpacity>
          <Text style={styles.mainText}>{letter}</Text>
        </View>
        <Text style={styles.tabText}>{recording ? "Recording..." : "TAP HERE"}</Text>
      </View>

      <Image source={cover} style={{ width: 200, height: 200, resizeMode: "contain" }} />

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
                ? "Awesome! You pronounced it correctly!"
                : "Oops! Try again!"}
            </Text>
            {!result.passed && (
              <TouchableOpacity style={styles.tryAgainBtn} onPress={() => setResult(null)}>
                <Text style={styles.tryAgainText}>Try Again</Text>
              </TouchableOpacity>
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
  letterContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  secondset: { color: "#F59E0B", fontFamily: "Popins-Regular", fontSize: 24 },
  padcontainer: { width: 314, height: 354, borderRadius: 61, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  textContainer: { flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" },
  mainText: { fontSize: 72, fontFamily: "Poppins-ExtraBold", color: "#ED7E2D" },
  tabText: { fontSize: 24, fontFamily: "Popins-Regular", color: "#ACA6A6" },
  soundbttn: { width: "100%", alignItems: "flex-end" },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", zIndex: 3000 },
  popupImage: { width: 120, height: 120, marginBottom: 20 },
  modalContent: { width: "80%", backgroundColor: "#fff", padding: 32, borderRadius: 25, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
  childPopupText: { fontSize: 24, fontWeight: "bold", color: "#000", textAlign: "center", marginBottom: 20 },
  tryAgainBtn: { backgroundColor: "#F59E0B", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 25 },
  tryAgainText: { color: "#fff", fontWeight: "bold", fontSize: 18, textAlign: "center" },
  floatingEmoji1: { position: "absolute", top: "20%", left: "10%", fontSize: 40, transform: [{ rotate: "-15deg" }] },
  floatingEmoji2: { position: "absolute", top: "25%", right: "15%", fontSize: 45, transform: [{ rotate: "10deg" }] },
});
