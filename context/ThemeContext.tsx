import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DarkTheme, LightTheme, MintTheme } from '../constants/Theme';

type ThemeType = 'light' | 'dark' | 'mint';

const ThemeContext = createContext({
  theme: MintTheme,
  themeType: 'mint' as ThemeType,
  setTheme: (type: ThemeType) => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeType, setThemeType] = useState<ThemeType>('mint');

  useEffect(() => {
    // Charger la préférence sauvegardée au démarrage
    AsyncStorage.getItem('user-theme').then(saved => {
      if (saved) setThemeType(saved as ThemeType);
    });
  }, []);

  const theme = themeType === 'mint' ? MintTheme : 
                themeType === 'dark' ? DarkTheme : LightTheme;

  const changeTheme = async (type: ThemeType) => {
    setThemeType(type);
    await AsyncStorage.setItem('user-theme', type);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeType, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useCustomTheme = () => useContext(ThemeContext);