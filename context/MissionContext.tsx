import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import { createContext, ReactNode, useEffect, useState } from 'react';

export type Mission = {
  id: string;
  letter: string;
  mission: 'draw' | 'voice';
  completed: boolean; // true if the specific mission (draw/voice) is completed
  unlocked: boolean;  // true if user can play this mission
};

export type MissionContextType = {
  missions: Mission[];
  setMissions: React.Dispatch<React.SetStateAction<Mission[]>>;
  completeMission: (id: string) => void;
  unlockNextMission: (letter: string) => void;
  unlockVoiceMission: (letter: string) => void;
  resetMissions: () => void;
  isLoading: boolean;
};

export const MissionContext = createContext<MissionContextType>({
  missions: [],
  setMissions: () => {},
  completeMission: () => {},
  unlockNextMission: () => {},
  unlockVoiceMission: () => {},
  resetMissions: () => {},
  isLoading: true,
});

// generate initial 52 missions (A-Z with draw and voice for each)
const generateInitialMissions = (): Mission[] => {
  const missions: Mission[] = [];
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    // Add draw mission
    missions.push({
      id: `${letter}-draw`,
      letter,
      mission: 'draw',
      completed: false,
      unlocked: i === 0, // only 'A' draw unlocked by default
    });
    // Add voice mission
    missions.push({
      id: `${letter}-voice`,
      letter,
      mission: 'voice',
      completed: false,
      unlocked: false, // voice missions unlock after draw is completed
    });
  }
  return missions;
};

export const MissionProvider = ({ children }: { children: ReactNode }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // load missions from AsyncStorage
  useEffect(() => {
    const loadMissions = async () => {
      try {
        setIsLoading(true);
        const data = await AsyncStorage.getItem('missions');
        if (data) {
          const parsed: Mission[] = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length === 52) {
            setMissions(parsed);
          } else {
            setMissions(generateInitialMissions());
          }
        } else {
          setMissions(generateInitialMissions());
        }
      } catch {
        setMissions(generateInitialMissions());
      } finally {
        setIsLoading(false);
      }
    };
    loadMissions();
  }, []);

  // save missions whenever they change
  useEffect(() => {
    if (!isLoading && missions.length) {
      AsyncStorage.setItem('missions', JSON.stringify(missions)).catch(() => {});
    }
  }, [missions, isLoading]);

  // mark a mission as completed
  const completeMission = (id: string) => {
    setMissions(prev =>
      prev.map(m => (m.id === id ? { ...m, completed: true } : m))
    );
  };

  // unlock voice mission after draw is completed
  const unlockVoiceMission = (letter: string) => {
    const currentLetter = letter.toUpperCase();
    
    setMissions(prev => {
      const newMissions = [...prev];
      const voiceMission = newMissions.find(m => m.letter === currentLetter && m.mission === 'voice');
      if (voiceMission && !voiceMission.unlocked) {
        voiceMission.unlocked = true;
        console.log(`🔓 Voice mission unlocked for letter ${currentLetter}`);
      }
      return newMissions;
    });
  };

  // unlock next mission if previous letter fully completed
  const unlockNextMission = (letter: string) => {
    const currentLetter = letter.toUpperCase();
    
    // check if all missions of current letter completed
    const currentLetterMissions = missions.filter(m => m.letter === currentLetter);
    const allCompleted = currentLetterMissions.every(m => m.completed);

    if (!allCompleted) return;

    // find next letter
    const currentLetterIndex = currentLetter.charCodeAt(0) - 65;
    const nextLetterIndex = currentLetterIndex + 1;
    
    if (nextLetterIndex < 26) {
      const nextLetter = String.fromCharCode(65 + nextLetterIndex);
      
      // unlock next letter's draw mission
      setMissions(prev => {
        const newMissions = [...prev];
        const nextDrawMission = newMissions.find(m => m.letter === nextLetter && m.mission === 'draw');
        if (nextDrawMission && !nextDrawMission.unlocked) {
          nextDrawMission.unlocked = true;
          console.log(`🎉 Next letter ${nextLetter} draw mission unlocked!`);
        }
        return newMissions;
      });
    }
  };

  const resetMissions = async () => {
    const fresh = generateInitialMissions();
    setMissions(fresh);
    try {
      await AsyncStorage.setItem('missions', JSON.stringify(fresh));
    } catch {}
  };

  return (
    <MissionContext.Provider
      value={{ missions, setMissions, completeMission, unlockNextMission, unlockVoiceMission, resetMissions, isLoading }}
    >
      {children}
    </MissionContext.Provider>
  );
};
