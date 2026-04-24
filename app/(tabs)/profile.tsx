import { deleteAccount, signOutUser } from '@/api/auth';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text, TouchableOpacity,
  View
} from 'react-native';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Fonction pour choisir une nouvelle photo de profil et l'uploader
  const pickAndUploadAvatar = async () => {
    // Affiche la galerie photo
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Force un format carré
      quality: 0.5,
    });

    if (result.canceled || !result.assets[0].uri || !userId) return;

    setUploading(true);
    try {
      const image = result.assets[0];
      const fileExt = image.uri.split('.').pop();
      const filePath = `${userId}/avatar-${Math.random()}.${fileExt}`;

      // Conversion de l'image pour Supabase
      const response = await fetch(image.uri);
      const arrayBuffer = await response.arrayBuffer();

      // 1. Envoi vers le Storage Supabase (Bucket 'avatars')
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: image.mimeType || 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Mise à jour du profil dans la table 'profiles'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Mise à jour de l'affichage local
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      Alert.alert("Succès", "Photo de profil mise à jour !");

    } catch (e: any) {
      Alert.alert("Erreur d'upload", e.message);
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données seront effacées.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/(auth)/LoginScreen');
            } catch (e: any) { alert(e.message); }
          }
        }
      ]
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#4CE5AE" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploading}>
          <View style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>{profile?.username?.charAt(0).toUpperCase()}</Text>
            )}
            <View style={styles.editBadge}>
              {uploading ? <ActivityIndicator size="small" color="#000" /> : <MaterialCommunityIcons name="pencil" size={14} color="black" />}
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.username}>{profile?.username}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sécurité</Text>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/(auth)/UpdatePasswordScreen')}
        >
          <MaterialCommunityIcons name="lock-reset" size={22} color="#6c7d76" />
          <Text style={styles.menuText}>Changer le mot de passe</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <View style={styles.menuItem}>
          <MaterialCommunityIcons name="bell-outline" size={22} color="#6c7d76" />
          <Text style={styles.menuText}>Notifications Push</Text>
          <Switch 
            value={notificationsEnabled} 
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#333", true: "#4CE5AE" }}
            thumbColor={notificationsEnabled ? "#fff" : "#888"}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#ff4444' }]}>Zone de danger</Text>
        <TouchableOpacity style={styles.menuItem} onPress={confirmDelete}>
          <MaterialCommunityIcons name="account-remove-outline" size={22} color="#ff4444" />
          <Text style={[styles.menuText, { color: '#ff4444' }]}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => signOutUser()}>
        <Text style={styles.logoutLabel}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centered: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatarWrapper: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#1e1e1e', borderWidth: 2, borderColor: '#4CE5AE', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 55 },
  avatarLetter: { color: '#4CE5AE', fontSize: 44, fontWeight: 'bold' },
  editBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#4CE5AE', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#121212' },
  username: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 15 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#6c7d76', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginBottom: 8 },
  menuText: { flex: 1, color: '#fff', marginLeft: 12, fontSize: 15 },
  logoutBtn: { marginTop: 10, padding: 20, alignItems: 'center' },
  logoutLabel: { color: '#6c7d76', fontSize: 15, textDecorationLine: 'underline' }
});