import { resetPassword, signInUser, signUpUser } from '@/api/auth';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform, ScrollView,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  
  // States pour les formulaires
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
        alert("Compte créé ! Vérifiez vos emails pour confirmer.");
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
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        
        {/* Logo - Remplace icon.png par ton logo.svg si configuré */}
        <Image 
          source={require('../../assets/images/icon.png')} 
          style={{ width: 150, height: 150, alignSelf: 'center', marginBottom: 20 }}
          resizeMode="contain"
        />

        <Text className="text-[#ccc] text-center text-lg mb-10">
          {isSignUp ? 'Créez votre compte' : 'Connectez-vous à votre collection'}
        </Text>

        <View className="space-y-4">
          {isSignUp && (
            <TextInput
              className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-[#333] text-lg"
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}
          
          <TextInput
            className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-[#333] text-lg"
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-[#333] text-lg"
            placeholder="Mot de passe"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!isSignUp && (
            <TouchableOpacity onPress={() => setForgotModalVisible(true)} className="py-2">
              <Text className="text-[#6c7d76] text-center">Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bouton Principal */}
        <TouchableOpacity 
          className="bg-[#4CE5AE] rounded-full p-4 mt-6 items-center shadow-lg"
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-black text-xl font-bold">
              {isSignUp ? "S'inscrire" : "Se connecter"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} className="mt-4">
          <Text className="text-[#4CE5AE] text-center font-medium">
            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? Créer un profil"}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-[1px] bg-[#333]" />
          <Text className="text-[#888] px-3">ou</Text>
          <View className="flex-1 h-[1px] bg-[#333]" />
        </View>

        {/* Boutons Sociaux */}
        <TouchableOpacity className="bg-white rounded-full p-4 mb-3 flex-row justify-center items-center">
          <FontAwesome5 name="google" size={18} color="black" />
          <Text className="text-black font-bold ml-3 text-base">Continuer avec Google</Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-[#5865F2] rounded-full p-4 flex-row justify-center items-center">
          <FontAwesome6 name="discord" size={18} color="white" />
          <Text className="text-white font-bold ml-3 text-base">Continuer avec Discord</Text>
        </TouchableOpacity>

        {/* Modal Mot de passe oublié */}
        <Modal 
          visible={forgotModalVisible} 
          transparent 
          animationType="fade"
          onRequestClose={() => setForgotModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/70 px-6">
            <View className="bg-[#1e1e1e] w-full p-6 rounded-3xl border border-[#333]">
              <Text className="text-[#4CE5AE] text-xl font-bold mb-4">
                Réinitialiser le mot de passe
              </Text>
              <Text className="text-gray-400 mb-6">
                Saisissez votre email pour recevoir un lien de réinitialisation.
              </Text>
              
              <TextInput
                className="bg-[#121212] text-white p-4 rounded-xl border border-[#333] mb-6"
                placeholder="Email"
                placeholderTextColor="#6c7d76"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                autoCapitalize="none"
              />

              <View className="flex-row space-x-3">
                <TouchableOpacity 
                  className="flex-1 p-4 rounded-xl border border-[#333]"
                  onPress={() => setForgotModalVisible(false)}
                >
                  <Text className="text-white text-center font-bold">Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-1 bg-[#4CE5AE] p-4 rounded-xl"
                  onPress={handleForgotPassword}
                  disabled={isSendingReset}
                >
                  {isSendingReset ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text className="text-black text-center font-bold">Envoyer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}