import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { resetPassword, signInUser, signInWithOAuth, signUpUser } from '@/api/auth';
import { FontAwesome5, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Logo from '../../assets/images/logo.svg';
import { useCustomTheme } from '../../context/ThemeContext';
import { getLoginStyles } from '../../styles/LoginScreen.styles';

export default function LoginScreen() {
  const { theme } = useCustomTheme();
  const { styles, inputStyles } = useMemo(() => getLoginStyles(theme), [theme]);

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
      
      // 1. Appeler l'API pour obtenir l'URL d'authentification
      const data = await signInWithOAuth(provider);
      
      if (data?.url) {
        // 2. Ouvrir le navigateur sécurisé
        const result = await WebBrowser.openAuthSessionAsync(
          data.url, 
          'gplayed://auth' // Doit correspondre au scheme dans app.json
        );

        // 3. Si l'utilisateur revient avec succès, extraire les jetons
        if (result.type === 'success' && result.url) {
          const { queryParams } = Linking.parse(result.url);
          
          // Les jetons sont souvent dans le fragment (#) ou les query params
          const accessToken = queryParams?.access_token || result.url.split('access_token=')[1]?.split('&')[0];
          const refreshToken = queryParams?.refresh_token || result.url.split('refresh_token=')[1]?.split('&')[0];

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken as string,
              refresh_token: refreshToken as string,
            });
            // La redirection vers /(tabs) sera gérée par votre _layout.tsx
          }
        }
      }
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
          <Logo 
            width={200} 
            height={52} 
            style={styles.logo} 
            color={theme.logo} 
            fill={theme.primary}
          />
          <View style={styles.taglineRow}>
            <Text style={styles.tagline}>
              {isSignUp ? 'Créez votre compte' : 'Your Gaming Story'}
            </Text>
          </View>
        </View>

        {/* ─── FORMULAIRE ─────────────────────────────────────── */}
        <View style={styles.formCard}>

          {isSignUp && (
            <InputField
              theme={theme}
              inputStyles={inputStyles}
              icon="account-outline"
              placeholder="Nom d'utilisateur"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}

          <InputField
            theme={theme}
            inputStyles={inputStyles}
            icon="email-outline"
            placeholder="Adresse email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <InputField
            theme={theme}
            inputStyles={inputStyles}
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
            <ActivityIndicator color={theme.bg} />
          ) : (
            <>
              <Text style={styles.mainButtonText}>
                {isSignUp ? "S'INSCRIRE" : "SE CONNECTER"}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={theme.bg} />
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
            <FontAwesome5 name="google" size={16} color={theme.bg} />
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
                <MaterialCommunityIcons name="lock-reset" size={22} color={theme.primary} />
              </View>
              <TouchableOpacity onPress={() => setForgotModalVisible(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Réinitialiser</Text>
            <Text style={styles.modalText}>
              Entrez votre email pour recevoir un lien de réinitialisation.
            </Text>

            <InputField
              theme={theme}
              inputStyles={inputStyles}
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
                  ? <ActivityIndicator color={theme.bg} />
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
const InputField = ({
  theme, inputStyles, icon, placeholder, value, onChangeText,
  secureTextEntry, autoCapitalize, keyboardType,
  rightIcon, onRightIconPress, dark
}: any) => (
  <View style={[inputStyles.wrapper, dark && inputStyles.wrapperDark]}>
    <MaterialCommunityIcons name={icon} size={18} color={theme.textSecondary} />
    <TextInput
      style={inputStyles.input}
      placeholder={placeholder}
      placeholderTextColor={theme.textMuted}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
    />
    {rightIcon && (
      <TouchableOpacity onPress={onRightIconPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <MaterialCommunityIcons name={rightIcon} size={18} color={theme.textSecondary} />
      </TouchableOpacity>
    )}
  </View>
);