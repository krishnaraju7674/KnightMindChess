import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type KnightThemeName = 'classic' | 'midnight' | 'royal' | 'emerald';

export type KnightTheme = {
  name: KnightThemeName;
  label: string;
  page: string;
  shell: string;
  panel: string;
  panelAlt: string;
  surface: string;
  surfaceText: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryText: string;
  secondary: string;
  secondaryText: string;
  danger: string;
  boardFrame: string;
  boardLight: string;
  boardDark: string;
  boardLastMove: string;
  premove: string;
  selection: string;
  legalDot: string;
  whitePiece: string;
  blackPiece: string;
  whiteShadow: string;
  blackShadow: string;
  glassBg: string;
  glassBorder: string;
  gradientStart: string;
  gradientEnd: string;
};

const THEME_STORAGE_KEY = 'knightmind.themeName';

const knightThemes: Record<KnightThemeName, KnightTheme> = {
  classic: {
    name: 'classic', label: 'Classic',
    page: '#302E2B', shell: '#262421', panel: '#262421', panelAlt: '#302E2B',
    surface: '#F7F6F2', surfaceText: '#262421', text: '#FFFFFF', muted: '#C7C2B8',
    border: '#4A4742', primary: '#81B64C', primaryText: '#14200C',
    secondary: '#B58863', secondaryText: '#1F130B', danger: '#8B2E2E',
    boardFrame: '#3E352D', boardLight: '#EEEED2', boardDark: '#769656',
    boardLastMove: '#F6C85F', premove: '#60A5FA', selection: '#1F2937',
    legalDot: '#1F2937', whitePiece: '#F8FAFC', blackPiece: '#111827',
    whiteShadow: '#111827', blackShadow: '#F8FAFC',
    glassBg: 'rgba(38, 36, 33, 0.72)', glassBorder: 'rgba(255, 255, 255, 0.08)',
    gradientStart: '#302E2B', gradientEnd: '#1A1A18',
  },
  midnight: {
    name: 'midnight', label: 'Midnight',
    page: '#111827', shell: '#172033', panel: '#172033', panelAlt: '#202C44',
    surface: '#F8FAFC', surfaceText: '#111827', text: '#F8FAFC', muted: '#CBD5E1',
    border: '#334155', primary: '#38BDF8', primaryText: '#082F49',
    secondary: '#A78BFA', secondaryText: '#2E1065', danger: '#BE123C',
    boardFrame: '#0F172A', boardLight: '#DDEAF6', boardDark: '#4D6B8A',
    boardLastMove: '#FBBF24', premove: '#F472B6', selection: '#0F172A',
    legalDot: '#0F172A', whitePiece: '#FFFFFF', blackPiece: '#0F172A',
    whiteShadow: '#0F172A', blackShadow: '#FFFFFF',
    glassBg: 'rgba(23, 32, 51, 0.72)', glassBorder: 'rgba(255, 255, 255, 0.06)',
    gradientStart: '#111827', gradientEnd: '#0F172A',
  },
  royal: {
    name: 'royal', label: 'Royal',
    page: '#1A0A2E', shell: '#2D1B4E', panel: '#2D1B4E', panelAlt: '#3D2A5E',
    surface: '#F5F0FF', surfaceText: '#1A0A2E', text: '#F5F0FF', muted: '#C4B5D4',
    border: '#5B3E8A', primary: '#D4AF37', primaryText: '#1A0A2E',
    secondary: '#A855F7', secondaryText: '#F5F0FF', danger: '#BE123C',
    boardFrame: '#2D1B4E', boardLight: '#F0E6FF', boardDark: '#7C3AED',
    boardLastMove: '#FBBF24', premove: '#F472B6', selection: '#D4AF37',
    legalDot: '#7C3AED', whitePiece: '#FFFFFF', blackPiece: '#1A0A2E',
    whiteShadow: '#1A0A2E', blackShadow: '#FFFFFF',
    glassBg: 'rgba(45, 27, 78, 0.72)', glassBorder: 'rgba(212, 175, 55, 0.15)',
    gradientStart: '#1A0A2E', gradientEnd: '#2D1B4E',
  },
  emerald: {
    name: 'emerald', label: 'Emerald',
    page: '#022C22', shell: '#064E3B', panel: '#064E3B', panelAlt: '#065F46',
    surface: '#F0FFF4', surfaceText: '#022C22', text: '#F0FFF4', muted: '#A7F3D0',
    border: '#059669', primary: '#FBBF24', primaryText: '#022C22',
    secondary: '#10B981', secondaryText: '#022C22', danger: '#DC2626',
    boardFrame: '#064E3B', boardLight: '#D1FAE5', boardDark: '#059669',
    boardLastMove: '#FCD34D', premove: '#F472B6', selection: '#FBBF24',
    legalDot: '#022C22', whitePiece: '#FFFFFF', blackPiece: '#022C22',
    whiteShadow: '#022C22', blackShadow: '#FFFFFF',
    glassBg: 'rgba(6, 78, 59, 0.72)', glassBorder: 'rgba(251, 191, 36, 0.15)',
    gradientStart: '#022C22', gradientEnd: '#064E3B',
  },
};

type KnightThemeContextValue = {
  theme: KnightTheme;
  themeName: KnightThemeName;
  toggleTheme: () => void;
  setTheme: (name: KnightThemeName) => void;
  themeNames: KnightThemeName[];
};

const KnightThemeContext = createContext<KnightThemeContextValue | null>(null);

function isKnightThemeName(value: string | null): value is KnightThemeName {
  return value === 'classic' || value === 'midnight' || value === 'royal' || value === 'emerald';
}

export function KnightThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<KnightThemeName>('royal');

  useEffect(() => {
    async function loadTheme() {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (isKnightThemeName(savedTheme)) setThemeName(savedTheme);
    }
    loadTheme();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(THEME_STORAGE_KEY, themeName);
  }, [themeName]);

  const value = useMemo(() => ({
    theme: knightThemes[themeName],
    themeName,
    toggleTheme: () => {
      const names: KnightThemeName[] = ['classic', 'midnight', 'royal', 'emerald'];
      const idx = names.indexOf(themeName);
      setThemeName(names[(idx + 1) % names.length]);
    },
    setTheme: setThemeName,
    themeNames: ['classic', 'midnight', 'royal', 'emerald'] as KnightThemeName[],
  }), [themeName]);

  return <KnightThemeContext.Provider value={value}>{children}</KnightThemeContext.Provider>;
}

export function useKnightTheme() {
  const value = useContext(KnightThemeContext);
  if (!value) throw new Error('useKnightTheme must be used inside KnightThemeProvider');
  return value;
}
