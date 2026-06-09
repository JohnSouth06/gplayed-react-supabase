import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCustomTheme } from '../context/ThemeContext';

interface BarcodeScannerProps {
  onGameFound: (gameData: any) => void;
  onError?: (message: string) => void;
}

export default function BarcodeScanner({ onGameFound, onError }: BarcodeScannerProps) {
  const { theme } = useCustomTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');

  // Empêche les scans en double pendant le traitement
  const isProcessing = useRef(false);

  // Animation du cadre de scan
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scanLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isActive && !isLoading) {
      scanLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      scanLoopRef.current.start();
    } else {
      scanLoopRef.current?.stop();
      scanLineAnim.setValue(0);
    }
    return () => scanLoopRef.current?.stop();
  }, [isActive, isLoading]);

  const handleOpen = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        onError?.('Permission caméra refusée. Activez-la dans les réglages.');
        return;
      }
    }
    isProcessing.current = false;
    setStatusLabel('Pointez vers un code-barres');
    setIsActive(true);
  };

  const handleClose = () => {
    setIsActive(false);
    setIsLoading(false);
    setStatusLabel('');
    isProcessing.current = false;
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    setIsLoading(true);
    setStatusLabel('Code détecté, recherche en cours…');

    try {
      const { lookupBarcode } = await import('../api/scandex');
      const gameData = await lookupBarcode(data);
      setIsActive(false);
      setIsLoading(false);
      setStatusLabel('');
      onGameFound(gameData);
    } catch (err: any) {
      setIsLoading(false);
      setStatusLabel(err.message || 'Jeu introuvable.');
      // Laisse 2s pour lire le message, puis autorise un nouveau scan
      setTimeout(() => {
        isProcessing.current = false;
        setStatusLabel('Pointez vers un code-barres');
      }, 2000);
    }
  };

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 90],
  });

  // ── Bouton fermé ─────────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <TouchableOpacity
        style={[styles.triggerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={handleOpen}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons name="barcode-scan" size={20} color={theme.primary} />
        <Text style={[styles.triggerLabel, { color: theme.textSecondary }]}>
          Scanner un code-barres
        </Text>
      </TouchableOpacity>
    );
  }

  // ── Caméra active ─────────────────────────────────────────────────────────
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={isLoading ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
      />

      {/* Fond semi-transparent autour du cadre */}
      <View style={styles.overlay}>
        {/* Ligne horizontale haute */}
        <View style={styles.overlayRow} />

        <View style={styles.overlayMiddle}>
          {/* Bande latérale gauche */}
          <View style={styles.overlaySide} />

          {/* Cadre de scan */}
          <View style={styles.scanFrame}>
            {/* Coins */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: theme.primary }]} />

            {/* Ligne de scan animée */}
            {!isLoading && (
              <Animated.View
                style={[
                  styles.scanLine,
                  { backgroundColor: theme.primary },
                  { transform: [{ translateY: scanLineTranslate }] },
                ]}
              />
            )}

            {/* Loader central */}
            {isLoading && (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            )}
          </View>

          {/* Bande latérale droite */}
          <View style={styles.overlaySide} />
        </View>

        {/* Fond bas + label */}
        <View style={styles.overlayBottom}>
          <Text style={[styles.statusLabel, { color: '#fff' }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Bouton fermeture */}
      <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
        <MaterialCommunityIcons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const FRAME_SIZE = 220;

const styles = StyleSheet.create({
  // Bouton déclencheur
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 0,
    marginBottom: 16,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  triggerLabel: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },

  // Conteneur caméra
  cameraContainer: {
    height: 340,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  overlayRow: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingTop: 16,
  },

  // Cadre transparent
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Coins du cadre
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

  // Ligne de scan
  scanLine: {
    position: 'absolute',
    width: '85%',
    height: 2,
    borderRadius: 1,
    opacity: 0.85,
  },

  loaderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  statusLabel: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_500Medium',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
