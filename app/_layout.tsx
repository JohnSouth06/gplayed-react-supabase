import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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

  const onAnimationFinish = () => {
    if (!minimumTimeElapsed || !initialized) {
      animationRef.current?.play(45, 90);
    } else {
      setIsSplashAnimationComplete(true);
    }
  };

  const showApp = initialized && minimumTimeElapsed && isSplashAnimationComplete;

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(auth)/LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>

      {!showApp && (
        <View style={[StyleSheet.absoluteFill, styles.splashContainer]}>
          <LottieView
            ref={animationRef}
            source={require('../assets/animations/splash.json')}
            autoPlay
            loop={false}
            speed={1}
            style={{ width: '60%', aspectRatio: 1 }}
            resizeMode="contain"
            onAnimationFinish={onAnimationFinish}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});