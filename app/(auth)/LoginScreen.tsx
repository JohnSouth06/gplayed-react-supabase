import { resetPassword, signInUser, signUpUser } from '@/api/auth';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform, ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image 
          source={require('../../assets/images/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.subtitle}>
          {isSignUp ? 'Créez votre compte' : 'Connectez-vous à votre collection'}
        </Text>

        <View style={styles.inputContainer}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!isSignUp && (
            <TouchableOpacity onPress={() => setForgotModalVisible(true)} style={styles.forgotButton}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.button, styles.mainButton]} 
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? "S'INSCRIRE" : "SE CONNECTER"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 20 }}>
          <Text style={styles.toggleText}>
            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? Créer un profil"}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={[styles.button, styles.googleButton]}>
          <FontAwesome5 name="google" size={18} color="black" />
          <Text style={styles.googleButtonText}>Continuer avec Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.discordButton]}>
          <FontAwesome6 name="discord" size={18} color="white" />
          <Text style={styles.discordButtonText}>Continuer avec Discord</Text>
        </TouchableOpacity>

        {/* Modal Mot de passe oublié */}
        <Modal visible={forgotModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Réinitialiser le mot de passe</Text>
              <Text style={styles.modalText}>Saisissez votre email pour recevoir un lien.</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Email"
                placeholderTextColor="#6c7d76"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                autoCapitalize="none"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setForgotModalVisible(false)}>
                  <Text style={{ color: '#fff' }}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleForgotPassword}>
                  {isSendingReset ? <ActivityIndicator color="#000" /> : <Text style={{ fontWeight: 'bold' }}>Envoyer</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 150, height: 150, alignSelf: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 40 },
  inputContainer: { marginBottom: 20 },
  input: { 
    backgroundColor: '#1e1e1e', color: '#fff', borderRadius: 12, 
    padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#333' 
  },
  forgotButton: { alignSelf: 'center', paddingVertical: 5 },
  forgotText: { color: '#6c7d76', fontSize: 14 },
  button: { 
    borderRadius: 35, padding: 16, alignItems: 'center', 
    flexDirection: 'row', justifyContent: 'center' 
  },
  mainButton: { backgroundColor: '#4CE5AE' },
  buttonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  toggleText: { color: '#4CE5AE', textAlign: 'center', fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  divider: { flex: 1, height: 1, backgroundColor: '#333' },
  dividerText: { color: '#888', paddingHorizontal: 10 },
  googleButton: { backgroundColor: '#fff', marginBottom: 12 },
  googleButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  discordButton: { backgroundColor: '#5865F2' },
  discordButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  // Styles Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e1e1e', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#4CE5AE', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: { color: '#aaa', marginBottom: 20 },
  modalInput: { backgroundColor: '#121212', color: '#fff', borderRadius: 10, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtnCancel: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  modalBtnConfirm: { flex: 1, backgroundColor: '#4CE5AE', padding: 15, alignItems: 'center', borderRadius: 10 }
});