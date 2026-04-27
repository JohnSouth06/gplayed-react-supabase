import { resetPassword, signInUser, signInWithOAuth, signUpUser } from '@/api/auth';
import { FontAwesome5, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Logo from '../../assets/images/logo.svg';

// ─── Design Tokens (partagés avec index.tsx) ────────────────────────────────
const C = {
  bg: '#272727',
  surface: '#2F2F2F',
  surfaceHigh: '#383838',
  border: '#3D3D3D',
  primary: '#4CE5AE',
  primaryDim: 'rgba(76,229,174,0.12)',
  textPrimary: '#F0F0F0',
  textSecondary: '#7A8C86',
  textMuted: '#4E5E58',
  discord: '#5865F2',
};

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !username)) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpUser(email, password, username);
        alert("Compte créé ! Vérifiez vos emails.");
        setIsSignUp(false);
      } else {
        await signInUser(email, password);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setIsSendingReset(true);
    try {
      await resetPassword(forgotEmail);
      alert("Lien envoyé !");
      setForgotModalVisible(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'discord') => {
    try {
      setIsLoading(true);
      await signInWithOAuth(provider);
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ─── LOGO + HEADER ──────────────────────────────────── */}
        <View style={styles.logoArea}>
          <Logo width={200} height={52} style={styles.logo} resizeMode="contain" />
          <View style={styles.taglineRow}>
            <View style={styles.taglineAccent} />
            <Text style={styles.tagline}>
              {isSignUp ? 'Créez votre compte' : 'Your Gaming Story'}
            </Text>
          </View>
        </View>

        {/* ─── FORMULAIRE ─────────────────────────────────────── */}
        <View style={styles.formCard}>

          {isSignUp && (
            <InputField
              icon="account-outline"
              placeholder="Nom d'utilisateur"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}

          <InputField
            icon="email-outline"
            placeholder="Adresse email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <InputField
            icon="lock-outline"
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          {!isSignUp && (
            <TouchableOpacity
              onPress={() => setForgotModalVisible(true)}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── BOUTON PRINCIPAL ───────────────────────────────── */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleAuth}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={C.bg} />
          ) : (
            <>
              <Text style={styles.mainButtonText}>
                {isSignUp ? "S'INSCRIRE" : "SE CONNECTER"}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={C.bg} />
            </>
          )}
        </TouchableOpacity>

        {/* ─── TOGGLE SIGN IN / SIGN UP ───────────────────────── */}
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleButton}>
          <Text style={styles.toggleText}>
            {isSignUp ? "Déjà un compte ? " : "Pas de compte ? "}
            <Text style={styles.toggleTextAccent}>
              {isSignUp ? "Se connecter" : "Créer un profil"}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* ─── DIVIDER ────────────────────────────────────────── */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.divider} />
        </View>

        {/* ─── BOUTONS SOCIAUX ────────────────────────────────── */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => handleSocialLogin('google')}
          activeOpacity={0.85}
        >
          <View style={styles.socialIconWrap}>
            <FontAwesome5 name="google" size={16} color={C.bg} />
          </View>
          <Text style={styles.socialButtonText}>Continuer avec Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, styles.discordButton]}
          onPress={() => handleSocialLogin('discord')}
          activeOpacity={0.85}
        >
          <View style={[styles.socialIconWrap, styles.discordIconWrap]}>
            <FontAwesome6 name="discord" size={16} color="#fff" />
          </View>
          <Text style={[styles.socialButtonText, { color: '#fff' }]}>Continuer avec Discord</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ─── MODAL MOT DE PASSE OUBLIÉ ──────────────────────── */}
      <Modal visible={forgotModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconWrap}>
                <MaterialCommunityIcons name="lock-reset" size={22} color={C.primary} />
              </View>
              <TouchableOpacity onPress={() => setForgotModalVisible(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={18} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Réinitialiser</Text>
            <Text style={styles.modalText}>
              Entrez votre email pour recevoir un lien de réinitialisation.
            </Text>

            <InputField
              icon="email-outline"
              placeholder="Adresse email"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              dark
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setForgotModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={handleForgotPassword}
                disabled={isSendingReset}
              >
                {isSendingReset
                  ? <ActivityIndicator color={C.bg} />
                  : <Text style={styles.modalBtnConfirmText}>Envoyer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

// ─── Composant InputField ────────────────────────────────────────────────────
type InputFieldProps = {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
  keyboardType?: 'default' | 'email-address';
  rightIcon?: string;
  onRightIconPress?: () => void;
  dark?: boolean;
};

const InputField = ({
  icon, placeholder, value, onChangeText,
  secureTextEntry, autoCapitalize, keyboardType,
  rightIcon, onRightIconPress, dark
}: InputFieldProps) => (
  <View style={[inputStyles.wrapper, dark && inputStyles.wrapperDark]}>
    <MaterialCommunityIcons name={icon as any} size={18} color={C.textSecondary} />
    <TextInput
      style={inputStyles.input}
      placeholder={placeholder}
      placeholderTextColor={C.textMuted}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
    />
    {rightIcon && (
      <TouchableOpacity onPress={onRightIconPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <MaterialCommunityIcons name={rightIcon as any} size={18} color={C.textSecondary} />
      </TouchableOpacity>
    )}
  </View>
);

const inputStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  wrapperDark: {
    backgroundColor: C.bg,
  },
  input: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 15,
  },
});

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // LOGO
  logoArea: {
    alignItems: 'center',
    marginBottom: 36,
    gap: 14,
  },
  logo: {
    alignSelf: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taglineAccent: {
    width: 4,
    height: 18,
    backgroundColor: C.primary,
    borderRadius: 2,
  },
  tagline: {
    fontSize: 15,
    color: C.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
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

  // FORGOT
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    marginTop: -4,
    marginBottom: 4,
  },
  forgotText: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  // MAIN BUTTON
  mainButton: {
    backgroundColor: C.primary,
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  mainButtonText: {
    color: C.bg,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // TOGGLE
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleText: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextAccent: {
    color: C.primary,
    fontWeight: '700',
  },

  // DIVIDER
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // SOCIAL BUTTONS
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 14,
  },
  discordButton: {
    backgroundColor: C.discord,
    borderColor: C.discord,
  },
  socialIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discordIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  socialButtonText: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: C.surface,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.primaryDim,
    borderWidth: 1,
    borderColor: `${C.primary}44`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: C.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  modalText: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceHigh,
  },
  modalBtnCancelText: {
    color: C.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalBtnConfirm: {
    flex: 1,
    height: 48,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalBtnConfirmText: {
    color: C.bg,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});