import Voice, { SpeechErrorEvent, SpeechResultsEvent } from '@react-native-voice/voice';
import React, { useEffect, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// On définit les props attendues : une fonction qui renvoie le texte détecté
interface VoiceSearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string; // Optionnel : pour personnaliser le texte selon la page
}

export default function VoiceSearchInput({ onSearch, placeholder = "Appuyez pour parler" }: VoiceSearchInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [partialResult, setPartialResult] = useState('');

  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);

    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setPartialResult(e.value[0]);
      }
    };

    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        const finalQuery = e.value[0];
        setPartialResult(finalQuery);
        onSearch(finalQuery); // Renvoie le texte à la page parente
      }
      setIsListening(false);
    };

    // Callback d'erreur indispensable pour diagnostiquer les blocages en mode Release (APK)
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      setIsListening(false);
      Alert.alert(
        "Erreur de reconnaissance vocale",
        `Code : ${e.error?.code}\nMessage : ${e.error?.message || 'Interruption du service'}`
      );
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [onSearch]);

  const startListening = async () => {
    try {
      setPartialResult('');

      // Demande de permission dynamique obligatoire pour la production sur Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Autorisation du microphone",
            message: "L'application requiert l'accès à votre microphone pour permettre la recherche vocale de jeux vidéo.",
            buttonNeutral: "Plus tard",
            buttonNegative: "Annuler",
            buttonPositive: "Autoriser"
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Autorisation refusée",
            "La recherche vocale ne peut pas fonctionner sans accès au microphone."
          );
          return;
        }
      }

      await Voice.start('fr-FR');
    } catch (e: any) {
      console.error("Erreur de démarrage vocal:", e);
      Alert.alert(
        "Détail du blocage",
        `Erreur exacte : ${e.message || JSON.stringify(e)}`
      );
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error("Erreur d'arrêt vocal:", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {isListening ? `J'écoute... ${partialResult}` : placeholder}
      </Text>

      <TouchableOpacity
        style={[styles.button, isListening && styles.buttonActive]}
        onPress={isListening ? stopListening : startListening}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{isListening ? '🛑' : '🎤'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  text: {
    marginBottom: 8,
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#272727',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    fontSize: 22,
  },
});