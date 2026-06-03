// styles/VoiceSearchInput.styles.ts
import { StyleSheet } from 'react-native';

const BUTTON_SIZE = 52;

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
    gap: 10,
  },
  text: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'SpaceGrotesk_500Medium',
    textAlign: 'center',
    maxWidth: '85%',
  },
  textListening: {
    color: '#aaa',
    fontFamily: 'SpaceGrotesk_300Light',
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