// app/UpdatePasswordScreen.tsx
import { updateUserPassword } from '@/api/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Text, TextInput, TouchableOpacity, View, useColorScheme
} from 'react-native';
import { C, getUpdatePasswordStyles } from '../styles/UpdatePasswordScreen.styles';

export default function UpdatePasswordScreen() {
  const colorScheme = useColorScheme();
  const currentTheme = C;
  const accentColor = currentTheme.primary;

  const styles = useMemo(() => 
    getUpdatePasswordStyles(currentTheme, accentColor, currentTheme.primaryDim), 
  [currentTheme, accentColor]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // --- TON LOGIC DE FORCE (Source 21) ---
  const strength = useMemo(() => {
    if (password.length === 0) return { level: 0, label: '', color: 'transparent' };
    if (password.length < 6) return { level: 1, label: 'Trop court', color: currentTheme.red };
    if (password.length < 10) return { level: 2, label: 'Acceptable', color: '#FFD34C' };
    return { level: 3, label: 'Fort', color: accentColor };
  }, [password, currentTheme, accentColor]);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleUpdate = async () => {
    if (password !== confirmPassword) { Alert.alert("Erreur", "Les mots de passe ne correspondent pas."); return; }
    if (password.length < 6) { Alert.alert("Erreur", "Au moins 6 caractères."); return; }
    setIsLoading(true);
    try { await updateUserPassword(password); Alert.alert("Succès", "Mot de passe mis à jour !"); router.replace('/(tabs)'); } 
    catch (error: any) { Alert.alert("Erreur", error.message); } finally { setIsLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Sécurité", headerStyle: { backgroundColor: currentTheme.bg }, headerShadowVisible: false, headerTintColor: currentTheme.textPrimary, headerBackTitle: "Profil" }} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}><MaterialCommunityIcons name="shield-key-outline" size={38} color={accentColor} /></View>
        <View style={styles.titleRow}><Text style={styles.title}>Nouveau mot de passe</Text></View>
        <Text style={styles.subtitle}>Choisissez un mot de passe sécurisé pour protéger votre compte.</Text>

        <View style={styles.formCard}>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={currentTheme.textSecondary} />
            <TextInput style={styles.input} placeholder="Nouveau mot de passe" placeholderTextColor={currentTheme.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={currentTheme.textSecondary} /></TouchableOpacity>
          </View>

          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarRow}>{[1, 2, 3].map((i) => (<View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength.level ? strength.color : currentTheme.border }]} />))}</View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}

          <View style={[styles.inputWrapper, passwordsMatch && styles.inputWrapperSuccess, passwordsMismatch && styles.inputWrapperError]}>
            <MaterialCommunityIcons name="lock-check-outline" size={18} color={passwordsMatch ? accentColor : passwordsMismatch ? currentTheme.red : currentTheme.textSecondary} />
            <TextInput style={styles.input} placeholder="Confirmer" placeholderTextColor={currentTheme.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}><MaterialCommunityIcons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={currentTheme.textSecondary} /></TouchableOpacity>
          </View>

          {passwordsMismatch && (<View style={styles.feedbackRow}><MaterialCommunityIcons name="alert-circle-outline" size={13} color={currentTheme.red} /><Text style={[styles.feedbackText, { color: currentTheme.red }]}>Les mots de passe ne correspondent pas</Text></View>)}
          {passwordsMatch && (<View style={styles.feedbackRow}><MaterialCommunityIcons name="check-circle-outline" size={13} color={accentColor} /><Text style={[styles.feedbackText, { color: accentColor }]}>Les mots de passe correspondent</Text></View>)}
        </View>

        <TouchableOpacity style={[styles.button, (!passwordsMatch || isLoading) && styles.buttonDisabled]} onPress={handleUpdate} disabled={isLoading || !passwordsMatch}>
          {isLoading ? (<ActivityIndicator color={currentTheme.bg} />) : (<><MaterialCommunityIcons name="shield-check" size={18} color={currentTheme.bg} /><Text style={styles.buttonText}>METTRE À JOUR</Text></>)}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}