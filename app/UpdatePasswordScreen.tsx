import { updateUserPassword } from '@/api/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// ─── Design Tokens (partagés avec index.tsx) ────────────────────────────────
const C = {
  bg: '#1e1e1e',
  surface: '#272727',
  surfaceHigh: '#383838',
  border: '#3D3D3D',
  primary: '#4CE5AE',
  primaryDim: 'rgba(76,229,174,0.12)',
  textPrimary: '#F0F0F0',
  textSecondary: '#7A8C86',
  textMuted: '#677a73',
  red: '#FF4C4C',
  redDim: 'rgba(255,76,76,0.12)',
};

export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Indicateur de force du mot de passe
  const getPasswordStrength = (): { level: number; label: string; color: string } => {
    if (password.length === 0) return { level: 0, label: '', color: 'transparent' };
    if (password.length < 6) return { level: 1, label: 'Trop court', color: C.red };
    if (password.length < 10) return { level: 2, label: 'Acceptable', color: '#FFD34C' };
    return { level: 3, label: 'Fort', color: C.primary };
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const strength = getPasswordStrength();

  const handleUpdate = async () => {
    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setIsLoading(true);
    try {
      await updateUserPassword(password);
      alert("Mot de passe mis à jour avec succès !");
      router.replace('/(tabs)');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* ─── CONFIGURATION DE L'ENTÊTE DYNAMIQUE ─── */}
      <Stack.Screen 
        options={{
          headerTitle: "Sécurité",
          headerStyle: { backgroundColor: C.bg }, 
          headerShadowVisible: false, 
          headerTintColor: C.textPrimary,
          headerBackTitle: "Profil",
        }} 
      />

      <View style={styles.content}>

        {/* ─── ICÔNE + TITRE ──────────────────────────────────── */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="shield-key-outline" size={38} color={C.primary} />
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Nouveau mot de passe</Text>
        </View>
        <Text style={styles.subtitle}>
          Choisissez un mot de passe sécurisé pour protéger votre compte.
        </Text>

        {/* ─── FORMULAIRE ─────────────────────────────────────── */}
        <View style={styles.formCard}>

          {/* Champ mot de passe */}
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={C.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={C.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Indicateur de force */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarRow}>
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: i <= strength.level ? strength.color : C.border }
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Champ confirmation */}
          <View style={[
            styles.inputWrapper,
            passwordsMatch && styles.inputWrapperSuccess,
            passwordsMismatch && styles.inputWrapperError,
          ]}>
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={18}
              color={passwordsMatch ? C.primary : passwordsMismatch ? C.red : C.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={C.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={C.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Message de correspondance */}
          {passwordsMismatch && (
            <View style={styles.feedbackRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={13} color={C.red} />
              <Text style={[styles.feedbackText, { color: C.red }]}>
                Les mots de passe ne correspondent pas
              </Text>
            </View>
          )}
          {passwordsMatch && (
            <View style={styles.feedbackRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={13} color={C.primary} />
              <Text style={[styles.feedbackText, { color: C.primary }]}>
                Les mots de passe correspondent
              </Text>
            </View>
          )}
        </View>

        {/* ─── BOUTON ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.button, (!passwordsMatch || isLoading) && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={isLoading || !passwordsMatch}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={C.bg} />
          ) : (
            <>
              <MaterialCommunityIcons name="shield-check" size={18} color={C.bg} />
              <Text style={styles.buttonText}>METTRE À JOUR</Text>
            </>
          )}
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
  },

  // HEADER
  headerAvatarContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: `${C.primary}44`,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerAvatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.primaryDim,
    borderWidth: 1,
    borderColor: `${C.primary}44`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    justifyContent: 'center',
  },
  title: {
    color: C.textPrimary,
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: C.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 28,
  },

  // FORM CARD
  formCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  inputWrapperSuccess: {
    borderColor: `${C.primary}66`,
    backgroundColor: `${C.primary}08`,
  },
  inputWrapperError: {
    borderColor: `${C.red}66`,
    backgroundColor: `${C.red}08`,
  },
  input: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 15,
  },

  // STRENGTH INDICATOR
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: -4,
    paddingHorizontal: 4,
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: 5,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    minWidth: 60,
    textAlign: 'right',
  },

  // FEEDBACK
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -6,
    paddingHorizontal: 4,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // BUTTON
  button: {
    backgroundColor: C.primary,
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: C.bg,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // BACK
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  backText: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});