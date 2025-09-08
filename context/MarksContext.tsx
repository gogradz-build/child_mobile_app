import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface LetterMission {
  letter: string;
  mission: 'draw' | 'voice';
  score: number;
  maxScore: number;
  completed: boolean;
  attempts: number;
}
interface Mission {
  letter: string;
  mission: 'draw' | 'voice';  // <- add this
  completed: boolean;
  unlocked: boolean;
}

interface MarksContextType {
  marks: LetterMission[];
  addScore: (letter: string, mission: 'draw' | 'voice', score: number) => void;
  resetMarks: () => void;
}

const MarksContext = createContext<MarksContextType>({
  marks: [],
  addScore: () => {},
  resetMarks: () => {},
});

export const MarksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marks, setMarks] = useState<LetterMission[]>([]);

  useEffect(() => {
    const initMarks = async () => {
      const saved = await AsyncStorage.getItem('marks');
      if (saved) setMarks(JSON.parse(saved));
      else {
        // initialize 52 missions
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const initialMarks: LetterMission[] = [];
        letters.forEach(letter => {
          initialMarks.push({ letter, mission: 'draw', score: 0, maxScore: 2, completed: false, attempts: 0 });
          initialMarks.push({ letter, mission: 'voice', score: 0, maxScore: 1, completed: false, attempts: 0 });
        });
        setMarks(initialMarks);
        await AsyncStorage.setItem('marks', JSON.stringify(initialMarks));
      }
    };
    initMarks();
  }, []);

  const addScore = async (letter: string, mission: 'draw' | 'voice', score: number) => {
    setMarks(prev => {
      const newMarks = prev.map(m => {
        if (m.letter === letter && m.mission === mission) {
          if (m.completed) return m; // do not add again
          return { ...m, score: score, completed: true, attempts: m.attempts + 1 };
        }
        return m;
      });
      AsyncStorage.setItem('marks', JSON.stringify(newMarks));
      return newMarks;
    });
  };

  const resetMarks = async () => {
    await AsyncStorage.removeItem('marks');
    setMarks([]);
  };

  return <MarksContext.Provider value={{ marks, addScore, resetMarks }}>{children}</MarksContext.Provider>;
};

export const useMarks = () => useContext(MarksContext);
