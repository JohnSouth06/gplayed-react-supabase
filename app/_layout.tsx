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
  const { theme } = useCustomTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  
  const animationRef = useRef<LottieView>(null);
  const segments = useSegments();
  const router = useRouter();

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


  const hexToLottie = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1];
  };

  const dynamicSplash = useMemo(() => {
  const json = JSON.parse(JSON.stringify(require('../assets/animations/splash.json')));
  const primaryLottie = hexToLottie(theme.primary);
  const textLottie = hexToLottie(theme.textPrimary);

  json.assets[0].layers.forEach((layer: any) => {
    if (layer.nm === 'loading') layer.sc = theme.primary;

    if (layer.nm === 'gplayed') layer.sc = theme.textPrimary;

    if (layer.nm === 'circle' && layer.shapes) {
      layer.shapes[0].it[1].c.k = textLottie;
    }

    if (layer.nm === 'slogan' && layer.shapes) {
      layer.shapes.forEach((group: any) => {
        group.it?.forEach((item: any) => {
          if (item.ty === 'fl') item.c.k = textLottie;
        });
      });
    }
  });

  json.assets[1].layers.forEach((layer: any) => {
    if (layer.nm === 'cross_1' && layer.shapes) {
      layer.shapes[0].it[1].c.k = textLottie;
    }

    if (layer.nm === 'G' || layer.nm === 'P') {
      layer.sc = theme.textPrimary; 
      
      if (layer.ef?.[0]?.ef?.[3]?.v?.k) {
        layer.ef[0].ef[3].v.k = textLottie;
      }
    }
  });

  json.assets[2].layers.forEach((layer: any) => {
    if (layer.shapes?.[0]?.it?.[1]?.c?.k) {
      layer.shapes[0].it[1].c.k = primaryLottie;
    }
  });

  return json;
}, [theme]);
  
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
        <Stack.Screen name="(auth)/LoginScreen" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>

      {!showApp && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', zIndex: 999 }]}>
          <LottieView
            key={theme.primary}
            ref={animationRef}
            source={dynamicSplash}
            autoPlay
            loop={false}
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