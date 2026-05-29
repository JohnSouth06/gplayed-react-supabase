import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/VoiceSearchInput.styles';

const PHONETIC_CORRECTIONS: Record<string, string> = {
  // Ghost of Yotei
  'you take':   'Yotei',
  'you tail':   'Yotei',
  'you tay':    'Yotei',
  'yotay':      'Yotei',
  'yotta':      'Yotei',
  // Elden Ring
  'alden ring': 'Elden Ring',
  'eldan ring': 'Elden Ring',
  // Cyberpunk
  'cyber punk': 'Cyberpunk',
  // Final Fantasy
  'final fantasy': 'Final Fantasy',
  // Zelda
  'the legend of zelda': 'The Legend of Zelda',
};


function applyPhoneticCorrections(text: string): string {
  let corrected = text;
  for (const [wrong, right] of Object.entries(PHONETIC_CORRECTIONS)) {
    const regex = new RegExp(wrong, 'gi');
    corrected = corrected.replace(regex, right);
  }
  return corrected;
}

// ---------------------------------------------------------------------------

interface VoiceSearchInputProps {
  onSearch: (query: string) => void;
  onSubmit?: (finalQuery: string) => void;
  placeholder?: string;
}

export default function VoiceSearchInput({
  onSearch,
  onSubmit,
  placeholder = "Appuyez pour parler",
}: VoiceSearchInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [partialResult, setPartialResult] = useState('');

  // Mémoire "hors du temps" pour éviter le bug de Stale Closure
  const latestTextRef = useRef('');

  // Animation d'onde pulsante pendant l'écoute
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isListening) {
      opacityAnim.setValue(0.6);
      pulseAnim.setValue(1);
      pulseLoop.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.65, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.6, duration: 700, useNativeDriver: true }),
          ]),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
      opacityAnim.setValue(0);
    }
    return () => pulseLoop.current?.stop();
  }, [isListening]);

  useSpeechRecognitionEvent('start', () => setIsListening(true));

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    if (onSubmit) {
      onSubmit(latestTextRef.current);
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    const firstResult = event.results[0];
    if (!firstResult) return;

    const raw = firstResult.transcript || firstResult.alternatives?.[0]?.transcript || '';
    if (!raw) return;

    const text = applyPhoneticCorrections(raw);

    setPartialResult(text);
    latestTextRef.current = text;
    onSearch(text);

    if (firstResult.isFinal) {
      ExpoSpeechRecognitionModule.stop();
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    if (event.error !== 'no-speech') {
      Alert.alert("Erreur vocale", event.message || "Interruption du moteur vocal");
    }
  });

  const startListening = async () => {
    try {
      setPartialResult('');
      latestTextRef.current = '';
      onSearch('');

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission refusée", "Le micro est requis pour la dictée vocale.");
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: 'fr-FR',
        interimResults: true,
        continuous: false,
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de lancer la reconnaissance.");
    }
  };

  const stopListening = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  return (
    <View style={styles.container}>
      {/* Texte d'état */}
      <Text style={[styles.text, isListening && styles.textListening]} numberOfLines={1}>
        {isListening ? (partialResult ? partialResult : "J'écoute…") : placeholder}
      </Text>

      {/* Bouton avec halo pulsant */}
      <View style={styles.buttonWrapper}>
        {/* Anneau d'onde animé */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
            },
          ]}
        />

        <TouchableOpacity
          style={[styles.button, isListening && styles.buttonActive]}
          onPress={isListening ? stopListening : startListening}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isListening ? 'stop' : 'microphone'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BUTTON_SIZE = 52;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
    gap: 10,
  },
  text: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '85%',
  },
  textListening: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  buttonWrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#ff4444',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
    // Bordure subtile
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    // Ombre portée
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonActive: {
    backgroundColor: '#c0392b',
    borderColor: 'rgba(255,100,100,0.3)',
    shadowColor: '#ff4444',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});