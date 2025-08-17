import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useEffect, useState } from 'react';

type Mission = {
  id: string;
  letter: string;
  completed: boolean;
  unlocked: boolean;
};

type MissionContextType = {
  missions: Mission[];
  completeMission: (id: string) => void;
  resetMissions: () => void;
  isLoading: boolean;
};

export const MissionContext = createContext<MissionContextType>({
  missions: [],
  completeMission: () => {},
  resetMissions: () => {},
  isLoading: true,
});

// Generate initial 26 missions (A–Z)
const generateInitialMissions = (): Mission[] => {
  return Array.from({ length: 26 }, (_, i) => ({
    id: `m${i}`,
    letter: String.fromCharCode(65 + i), // 65 = 'A'
    completed: false,
    unlocked: i === 0, // only A unlocked by default
  }));
};

// Test AsyncStorage functionality
const testAsyncStorage = async (): Promise<boolean> => {
  try {
    const testKey = '__test_storage__';
    const testValue = 'test_value';
    
    await AsyncStorage.setItem(testKey, testValue);
    const retrievedValue = await AsyncStorage.getItem(testKey);
    await AsyncStorage.removeItem(testKey);
    
    return retrievedValue === testValue;
  } catch (error) {
    return false;
  }
};

export const MissionProvider = ({ children }: { children: ReactNode }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load missions from storage with proper error handling
  useEffect(() => {
    const loadMissions = async () => {
      try {
        setIsLoading(true);
        
        // Test AsyncStorage first
        const storageWorking = await testAsyncStorage();
        if (!storageWorking) {
          const initialMissions = generateInitialMissions();
          setMissions(initialMissions);
          setIsLoading(false);
          return;
        }
        
        // Try to load from storage
        const data = await AsyncStorage.getItem('missions');
        
        if (data) {
          try {
            const parsedMissions = JSON.parse(data);
            // Validate that we have the correct structure
            if (Array.isArray(parsedMissions) && parsedMissions.length === 26) {
              setMissions(parsedMissions);
            } else {
              throw new Error('Invalid mission data structure');
            }
          } catch (parseError) {
            // Fallback to initial missions
            const initialMissions = generateInitialMissions();
            setMissions(initialMissions);
            // Try to save the initial missions
            try {
              await AsyncStorage.setItem('missions', JSON.stringify(initialMissions));
            } catch (saveError) {
              // Ignore save errors
            }
          }
        } else {
          // First app run or no data → initialize missions
          const initialMissions = generateInitialMissions();
          setMissions(initialMissions);
          
          // Try to save the initial missions
          try {
            await AsyncStorage.setItem('missions', JSON.stringify(initialMissions));
          } catch (saveError) {
            // Ignore save errors
          }
        }
      } catch (error) {
        // Fallback to initial missions if everything fails
        const initialMissions = generateInitialMissions();
        setMissions(initialMissions);
      } finally {
        setIsLoading(false);
      }
    };

    loadMissions();
  }, []);

  // Save missions to storage whenever they change
  useEffect(() => {
    if (missions.length > 0 && !isLoading) {
      const saveMissions = async () => {
        try {
          await AsyncStorage.setItem('missions', JSON.stringify(missions));
        } catch (error) {
          // Ignore save errors
        }
      };
      
      saveMissions();
    }
  }, [missions, isLoading]);

  const completeMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m, i) => {
        if (m.id === id) {
          return { ...m, completed: true };
        }
        
        if (prev[i - 1]?.id === id) {
          return { ...m, unlocked: true };
        }
        return m;
      })
    );
  };

  const resetMissions = async () => {
    try {
      const fresh = generateInitialMissions();
      setMissions(fresh);
      
      // Try to save to storage
      try {
        await AsyncStorage.setItem('missions', JSON.stringify(fresh));
      } catch (saveError) {
        // Ignore save errors
      }
    } catch (error) {
      // Ignore reset errors
    }
  };

  return (
    <MissionContext.Provider value={{ missions, completeMission, resetMissions, isLoading }}>
      {children}
    </MissionContext.Provider>
  );
};
