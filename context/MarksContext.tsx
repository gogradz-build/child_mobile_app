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

interface MarksContextType {
  marks: LetterMission[];
  addScore: (letter: string, mission: 'draw' | 'voice', score: number) => void;
  resetMarks: () => void;
  clearAllMarks: () => void;
}

const MarksContext = createContext<MarksContextType>({
  marks: [],
  addScore: () => {},
  resetMarks: () => {},
  clearAllMarks: () => {},
});

export const MarksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marks, setMarks] = useState<LetterMission[]>([]);

  useEffect(() => {
    const initMarks = async () => {
      const saved = await AsyncStorage.getItem('marks');
      if (saved) {
        const parsedMarks = JSON.parse(saved);
        setMarks(parsedMarks);
      } else {
        // Start with empty marks - only add entries when missions are completed
        setMarks([]);
        await AsyncStorage.setItem('marks', JSON.stringify([]));
      }
    };
    initMarks();
  }, []);

  const addScore = async (letter: string, mission: 'draw' | 'voice', score: number) => {
    console.log(`🎯 Adding score for ${letter} ${mission}: ${score} points`);
    setMarks(prev => {
      // Check if entry already exists
      const existingEntry = prev.find(m => m.letter === letter && m.mission === mission);
      
      if (existingEntry) {
        // If entry exists and is already completed, don't update
        if (existingEntry.completed) {
          console.log(`⚠️ Entry already completed for ${letter} ${mission}, skipping`);
          return prev;
        }
        // Update existing entry
        const newMarks = prev.map(m => {
          if (m.letter === letter && m.mission === mission) {
            return { ...m, score: score, completed: true, attempts: m.attempts + 1 };
          }
          return m;
        });
        console.log(`✅ Updated existing entry for ${letter} ${mission}`);
        AsyncStorage.setItem('marks', JSON.stringify(newMarks));
        return newMarks;
      } else {
        // Create new entry
        const newEntry: LetterMission = {
          letter,
          mission,
          score,
          maxScore: 50,
          completed: true,
          attempts: 1
        };
        const newMarks = [...prev, newEntry];
        console.log(`🆕 Created new entry for ${letter} ${mission}`);
        AsyncStorage.setItem('marks', JSON.stringify(newMarks));
        return newMarks;
      }
    });
  };

  const resetMarks = async () => {
    await AsyncStorage.removeItem('marks');
    setMarks([]);
  };

  const clearAllMarks = async () => {
    console.log('🧹 Clearing all marks...');
    setMarks([]);
    await AsyncStorage.setItem('marks', JSON.stringify([]));
  };

  return <MarksContext.Provider value={{ marks, addScore, resetMarks, clearAllMarks }}>{children}</MarksContext.Provider>;
};

export const useMarks = () => useContext(MarksContext);
