import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { resetPassword, signInUser, signUpUser } from '../api/auth';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpUser(email, password, username);
        alert("Vérifiez vos emails pour confirmer l'inscription !");
      } else {
        await signInUser(email, password);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-slate-900">
      <Text className="text-4xl font-bold text-white mb-8 text-center">
        {isSignUp ? 'Créer un compte' : 'Bon retour !'}
      </Text>

      <View className="space-y-4">
        {isSignUp && (
          <TextInput
            className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700"
            placeholder="Nom d'utilisateur"
            placeholderTextColor="#94a3b8"
            onChangeText={setUsername}
          />
        )}
        <TextInput
          className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700"
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          onChangeText={setEmail}
        />
        <TextInput
          className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700"
          placeholder="Mot de passe"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          className="bg-indigo-600 p-4 rounded-xl mt-4 active:bg-indigo-700"
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : (
            <Text className="text-white text-center font-semibold text-lg">
              {isSignUp ? "S'inscrire" : "Se connecter"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text className="text-indigo-400 text-center mt-4">
            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
          </Text>
        </TouchableOpacity>

        {!isSignUp && (
          <TouchableOpacity onPress={() => resetPassword(email)}>
            <Text className="text-slate-400 text-center mt-2 text-sm">
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}