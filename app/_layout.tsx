import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeProvider, useCustomTheme } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync();

function MainLayout() {
  const { theme } = useCustomTheme(); // Récupère le thème actif (Mint, Dark, ou Light)
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  
  const animationRef = useRef<LottieView>(null);
  const segments = useSegments();
  const router = useRouter();

  // Configuration des filtres pour l'animation Lottie[cite: 15]
  const lottieFilters = useMemo(() => [
    // --- Remplace les éléments "VERTS" par la couleur primaire du thème ---
    { keypath: "loading", color: theme.primary },
    { keypath: "top-btn", color: theme.primary },
    { keypath: "right-btn", color: theme.primary },
    { keypath: "left-btn", color: theme.primary },
    { keypath: "bottom-btn", color: theme.primary },

    // --- Remplace les éléments "BLANCS" par la couleur de texte (devient sombre en Light mode) ---
    { keypath: "circle", color: theme.textPrimary },
    { keypath: "G", color: theme.textPrimary },
    { keypath: "P", color: theme.textPrimary },
    { keypath: "cross", color: theme.textPrimary },
    { keypath: "cross 2", color: theme.textPrimary },
    { keypath: "YOUR GAMING STORY Outlines", color: theme.textPrimary },
    { keypath: "GPLAYED", color: theme.textPrimary },
  ], [theme]);

  useEffect(() => {
    SplashScreen.hideAsync();

    const timer = setTimeout(() => {
      setMinimumTimeElapsed(true);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/UpdatePasswordScreen');
      } else {
        setSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer); 
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/LoginScreen');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  const onAnimationFinish = () => {
    if (!minimumTimeElapsed || !initialized) {
      animationRef.current?.play(45, 90);
    } else {
      setIsSplashAnimationComplete(true);
    }
  };

  const showApp = initialized && minimumTimeElapsed && isSplashAnimationComplete;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack>
        <Stack.Screen name="(auth)/LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>

      {!showApp && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', zIndex: 999 }]}>
          <LottieView
            ref={animationRef}
            source={require('../assets/animations/splash.json')}
            autoPlay
            loop={false}
            colorFilters={lottieFilters} // Application des couleurs dynamiques[cite: 15]
            onAnimationFinish={onAnimationFinish}
            style={{ width: '60%', aspectRatio: 1 }}
          />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}