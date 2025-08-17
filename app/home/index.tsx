import EraceIcon from '@/assets/icons/EraseIcon';
import HomeIcon from '@/assets/icons/HomeIcon';
import StaticHeartIcon from '@/assets/icons/MeterIcon';
import Paint from '@/assets/icons/PaintBucket';
import StaticIcon from '@/assets/icons/VolumeIcon';
import { MissionContext } from '@/context/MissionContext';
import { Audio } from "expo-av";
import React, { useContext, useEffect, useRef, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';

const lockGif = require('../../assets/gifs/LockedIcon.gif');
const cat = require('../../assets/images/cat.png');

const index = () => {
  const { missions, completeMission, isLoading } = useContext(MissionContext);
  const [localLoading, setLocalLoading] = useState(true);
  const isUnlock = (index: number) => missions[index]?.unlocked;
  const [notValidDisplay, setNotValidDisplay] = React.useState(false);

  
  const homeSound = useRef<Audio.Sound | null>(null);
  const lockSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!isLoading && missions.length > 0) {
      setLocalLoading(false);
    }
  }, [isLoading, missions]);

  useEffect(() => {
    if (notValidDisplay) {
      const timer = setTimeout(() => {
        setNotValidDisplay(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notValidDisplay]);

  
  interface SoundRef {
    current: Audio.Sound | null;
  }

  const stopAndUnloadSound = async (soundRef: SoundRef): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.warn("Error stopping sound:", error);
    }
  };

  
  const stopAllSounds = async () => {
    await stopAndUnloadSound(homeSound);
    await stopAndUnloadSound(lockSound);
  };

  
  const playHomeSound = async () => {
    try {
      
      await stopAllSounds();

      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/homeAudio.wav")
      );
      
      homeSound.current = sound;
      await sound.playAsync();

      
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          sound.unloadAsync();
          homeSound.current = null;
        }
      });
    } catch (error) {
      console.warn("Error playing home sound:", error);
    }
  };

  
  const playLockSound = async () => {
    try {
      
      await stopAndUnloadSound(homeSound);

      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/lock.wav") 
      );
      
      lockSound.current = sound;
      await sound.playAsync();

      
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          sound.unloadAsync();
          lockSound.current = null;
        }
      });
    } catch (error) {
      console.warn("Error playing lock sound:", error);
    }
  };

  
  useEffect(() => {
    playHomeSound();
    
   
    return () => {
      stopAllSounds();
    };
  }, []);

  const letters = Array.from({ length: 26 }, (_, i) => ({
    id: `m${i}`,
    letter: String.fromCharCode(65 + i),
  }));

  const handlePress = async (id: string, unlocked: boolean) => {
    if (unlocked) {
      
      console.log(`Mission ${id} selected`);
    } else {
      
      await playLockSound();
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
        renderItem={({ item, index }) => {
          const unlocked = isUnlock(index);
          return (
            <TouchableOpacity
              onPress={() => handlePress(item.id, unlocked)}
              style={styles.textContainer}
            >
              <Text
                style={[
                  styles.letters,
                  unlocked ? styles.unlockedLetter : styles.lockedLetter,
                ]}
              >
                {item.letter}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      <Image source={cat} />
      <View style={styles.bttn}>
        <TouchableOpacity>
          <HomeIcon size={32} color="#E0681D" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Paint size={32} color="#E0681D" />
        </TouchableOpacity>
        <TouchableOpacity>
          <EraceIcon size={32} color="#E0681D" />
        </TouchableOpacity>
        <TouchableOpacity>
          <StaticHeartIcon size={32} color="#E0681D" />
        </TouchableOpacity>
        <TouchableOpacity>
          <StaticIcon size={32} color="#E0681D" />
        </TouchableOpacity>
      </View>
      
      <Modal visible={notValidDisplay} transparent={true} animationType="slide">
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

export default index;

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    padding: 16,
    alignContent: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  mainText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 24,
    color: '#FFDBAF',
    marginBottom: 24,
  },
  textContainer: {
    width: 48,
    height: 48,
    margin: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letters: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    color: '#FFDBAF',
  },
  unlockedLetter: {
    color: '#FFD369',
  },
  lockedLetter: {
    color: '#434343',
  },
  bttn: {
    backgroundColor: '#FFB963',
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    width: 316,
    height: 44,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 250,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
});