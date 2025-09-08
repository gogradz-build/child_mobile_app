import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import { createContext, ReactNode, useEffect, useState } from 'react';

export type Mission = {
  id: string;
  letter: string;
  completed: boolean; // true if the level (voice/draw) is completed
  unlocked: boolean;  // true if user can play this mission
};

export type MissionContextType = {
  missions: Mission[];
  setMissions: React.Dispatch<React.SetStateAction<Mission[]>>;
  completeMission: (id: string) => void;
  unlockNextMission: (letter: string) => void;
  resetMissions: () => void;
  isLoading: boolean;
};

export const MissionContext = createContext<MissionContextType>({
  missions: [],
  setMissions: () => {},
  completeMission: () => {},
  unlockNextMission: () => {},
  resetMissions: () => {},
  isLoading: true,
});

// generate initial 26 missions (A-Z)
const generateInitialMissions = (): Mission[] => {
  return Array.from({ length: 26 }, (_, i) => ({
    id: `m${i}`,
    letter: String.fromCharCode(65 + i),
    completed: false,
    unlocked: i === 0, // only 'A' unlocked by default
  }));
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
          if (Array.isArray(parsed) && parsed.length === 26) {
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

  // unlock next mission if previous letter fully completed
  const unlockNextMission = (letter: string) => {
    const index = missions.findIndex(m => m.letter === letter.toUpperCase());
    if (index === -1) return;

    // check if all missions of current letter completed
    const currentLetterMissions = missions.filter(m => m.letter === letter.toUpperCase());
    const allCompleted = currentLetterMissions.every(m => m.completed);

    if (!allCompleted) return;

    // unlock next mission if exists
    if (index + 1 < missions.length && !missions[index + 1].unlocked) {
      setMissions(prev => {
        const newMissions = [...prev];
        newMissions[index + 1] = { ...newMissions[index + 1], unlocked: true };
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
      value={{ missions, setMissions, completeMission, unlockNextMission, resetMissions, isLoading }}
    >
      {children}
    </MissionContext.Provider>
  );
};
