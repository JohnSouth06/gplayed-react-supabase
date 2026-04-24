import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Vérifier la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // Écouter les changements (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    // Vérifier si l'utilisateur est dans le groupe (auth)
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Rediriger vers la connexion si pas de session et pas déjà dans auth
      router.replace('/(auth)/LoginScreen');
    } else if (session && inAuthGroup) {
      // Rediriger vers l'app principale si session active et dans auth
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  // Changement de mot de passe - Redirection après clic sur le lien dans l'email
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Rediriger vers l'écran de mise à jour du mot de passe
        router.replace('/(auth)/UpdatePasswordScreen');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Écouter les événements d'authentification pour la récupération de mot de passe
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Redirection vers l'écran de mise à jour si l'événement de récupération est détecté
        router.replace('/(auth)/UpdatePasswordScreen');
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(auth)/LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
  }