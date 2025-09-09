import FooterButton from '@/components/FooterButton';
import { MissionContext } from '@/context/MissionContext';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer } from "expo-audio";
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';

const lockGif = require('../../assets/gifs/LockedIcon.gif');
const cat = require('../../assets/images/cat.png');

const HomeScreen = () => {
  const { missions, completeMission, isLoading } = useContext(MissionContext);
  const [localLoading, setLocalLoading] = useState(true);
  const [notValidDisplay, setNotValidDisplay] = useState(false);
  const [mute, setMute] = useState(false);
  const [isEraser, setIsEraser] = useState(false);

  const homeAudioPlayer = useAudioPlayer(require("../../assets/sounds/alphabetsong.mp3"));
  const lockAudioPlayer = useAudioPlayer(require("../../assets/sounds/lock.wav"));
  const router = useRouter();

  const isUnlock = (letter: string) => {
    const drawMission = missions.find(m => m.letter === letter && m.mission === 'draw');
    return drawMission?.unlocked || false;
  };

  useEffect(() => {
    if (!isLoading && missions.length > 0) {
      setLocalLoading(false);
    }
  }, [isLoading, missions]);

  useEffect(() => {
    if (notValidDisplay) {
      const timer = setTimeout(() => setNotValidDisplay(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [notValidDisplay]);

  // Play/Stop music when screen is focused/unfocused
  useFocusEffect(
    React.useCallback(() => {
      if (!mute) {
        homeAudioPlayer.play();
      }
      return () => {
        homeAudioPlayer.pause();
        homeAudioPlayer.seekTo(0);
      };
    }, [mute])
  );

  useEffect(() => {
    if (mute) {
      homeAudioPlayer.pause();
      homeAudioPlayer.seekTo(0);
      lockAudioPlayer.pause();
      lockAudioPlayer.seekTo(0);
    } else {
      homeAudioPlayer.play();
    }
  }, [mute]);

  const playLockSound = () => {
    try {
      if (homeAudioPlayer.playing) {
        homeAudioPlayer.pause();
        homeAudioPlayer.seekTo(0);
      }
      lockAudioPlayer.play();
    } catch (error) {
      console.warn("Error playing lock sound:", error);
    }
  };

  const letters = Array.from({ length: 26 }, (_, i) => ({
    id: `m${i}`,
    letter: String.fromCharCode(65 + i),
  }));

  const handlePress = (id: string, unlocked: boolean, letter: string) => {
    if (unlocked) {
      homeAudioPlayer.pause();
      homeAudioPlayer.seekTo(0);
      router.push({
        pathname: "./mission",
        params: { letter },
      });
    } else {
      playLockSound();
      setNotValidDisplay(true);
    }
  };

  if (isLoading || localLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (missions.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={[styles.mainText, { color: '#e61111' }]}>Failed to load missions</Text>
        <Text style={[styles.mainText, { fontSize: 16, marginTop: 8 }]}>Please restart the app</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.mainText}>LET'S LEARN</Text>

      <FlatList
        data={letters}
        numColumns={5}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const unlocked = isUnlock(item.letter);
          return (
            <TouchableOpacity
              onPress={() => handlePress(item.id, unlocked, item.letter)}
              style={styles.textContainer}
            >
              <Text style={[
                styles.letters,
                unlocked ? styles.unlockedLetter : styles.lockedLetter
              ]}>
                {item.letter}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Image source={cat} />
      <FooterButton
        setMute={setMute}
        mute={mute}
        undo={() => null}
        clear={() => null}
        isEraser={isEraser}
      />

      <Modal visible={notValidDisplay} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Animatable.Image
              source={lockGif}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
              animation="fadeInUp"
              iterationCount={1}
              duration={2000}
            />
            <Text style={styles.modalText}>Oops! This mission is locked 🔒</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { paddingTop: 32, alignItems: 'center', backgroundColor: '#fff', flex: 1, padding: 16 },
  mainText: { fontFamily: 'Poppins-Regular', fontSize: 24, color: '#FFDBAF', marginBottom: 24 },
  textContainer: { width: 48, height: 48, margin: 8, marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  letters: { fontFamily: 'Poppins-ExtraBold', fontSize: 32, fontWeight: 'bold', textAlign: 'center', textAlignVertical: 'center' },
  loadingText: { fontFamily: 'Poppins-Regular', fontSize: 18, color: '#FFDBAF' },
  unlockedLetter: { color: '#FFD369' },
  lockedLetter: { color: '#434343' },
  modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: 250, padding: 20, backgroundColor: '#FF8C42', borderRadius: 10, alignItems: 'center' },
  modalText: { fontFamily: 'Poppins-Regular', fontSize: 24, color: '#333', textAlign: 'center', marginTop: 10 },
});
