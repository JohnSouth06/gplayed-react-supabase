import { deleteAccount, signOutUser } from '@/api/auth';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { C } from '../constants/Theme';
import { menuStyles, sectionStyles, styles } from './profile.styles';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
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

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('/api/upload-avatar', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      console.log("Image optimisée disponible ici :", data.url);
      // Mettre à jour l'affichage localement
    }
  };

const pickAndUploadAvatar = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1, 
  });

  if (result.canceled || !userId) return;

  setUploading(true);
  setProgress(0.1);

  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 400, height: 400 } }], // On redimensionne
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Compression à 70%
    );

    setProgress(0.3);

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (currentProfile?.avatar_url) {
      const oldFileName = currentProfile.avatar_url.split('/').pop()?.split('?')[0];
      if (oldFileName) {
        await supabase.storage.from('avatars').remove([oldFileName]);
      }
    }

    setProgress(0.5);

    // --- ÉTAPE 3 : UPLOAD DU NOUVEAU FICHIER ---
    const fileName = `${userId}-${Date.now()}.jpg`;
    const formData = new FormData();
    // @ts-ignore
    formData.append('file', {
      uri: manipulatedImage.uri,
      name: fileName,
      type: 'image/jpeg',
    });

    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, formData);

    if (uploadError) throw uploadError;

    // --- ÉTAPE 4 : MISE À JOUR DE LA BASE DE DONNÉES ---
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Mise à jour de l'interface
    setProfile(prev => prev ? { ...prev, avatar_url: `${publicUrl}?t=${Date.now()}` } : null);
    setProgress(1);

  } catch (e: any) {
    Alert.alert("Erreur", e.message);
  } finally {
    setUploading(false);
    setProgress(0);
  }
};

  const confirmDelete = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données de collection seront effacées définitivement.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAccount();
            } catch (e: any) {
              Alert.alert("Erreur", e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  const initials = profile?.username?.charAt(0).toUpperCase() ?? '?';

  // ─── Composants internes ─────────────────────────────────────────────────────

const SectionTitle = ({
  label, icon, danger
}: { label: string; icon: string; danger?: boolean }) => (
  <View style={sectionStyles.row}>
    <MaterialCommunityIcons
      name={icon as any}
      size={13}
      color={danger ? C.red : C.primary}
    />
    <Text style={[sectionStyles.label, danger && { color: C.red }]}>{label}</Text>
  </View>
);

const MenuRow = ({
  icon, label, onPress, showChevron, danger
}: {
  icon: string;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
}) => (
  <TouchableOpacity style={menuStyles.item} onPress={onPress} activeOpacity={0.75}>
    <View style={[
      menuStyles.iconWrap,
      danger
        ? { backgroundColor: C.redDim }
        : { backgroundColor: C.primaryDim }
    ]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={17}
        color={danger ? C.red : C.primary}
      />
    </View>
    <Text style={[menuStyles.label, danger && { color: C.red }]}>{label}</Text>
    {showChevron && (
      <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
    )}
  </TouchableOpacity>
);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      <Stack.Screen
        options={{
          headerTitle: "Profil",
          headerStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
          headerTintColor: C.textPrimary,
          headerBackTitle: "Retour",
        }}
      />

      {/* ─── HEADER AVATAR ──────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploading} activeOpacity={0.85}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarWrapper}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  key={profile.avatar_url}
                />
              ) : (
                <Text style={styles.avatarLetter}>{initials}</Text>
              )}

              {uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color={C.primary} />
                </View>
              )}
            </View>
          </View>

          {/* Badge édition */}
          <View style={styles.editBadge}>
            <MaterialCommunityIcons name="camera-outline" size={13} color={C.bg} />
          </View>
        </TouchableOpacity>

        {/* Barre de progression */}
        {uploading && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}

        <View style={styles.usernamRow}>
          <Text style={styles.username}>{profile?.username}</Text>
        </View>
        <Text style={styles.memberLabel}>Membre</Text>
      </View>

      {/* ─── SECTION SÉCURITÉ ───────────────────────────────── */}
      <SectionTitle label="Sécurité" icon="shield-outline" />
      <View style={styles.card}>
        <MenuRow
          icon="lock-reset"
          label="Changer le mot de passe"
          onPress={() => router.push('/UpdatePasswordScreen')}
          showChevron
        />
      </View>

      {/* ─── SECTION PRÉFÉRENCES ────────────────────────────── */}
      <SectionTitle label="Préférences" icon="tune-variant" />
      <View style={styles.card}>
        <View style={styles.menuItem}>
          <View style={[styles.menuIconWrap, { backgroundColor: `rgba(122,140,134,0.15)` }]}>
            <MaterialCommunityIcons name="bell-outline" size={17} color={C.textSecondary} />
          </View>
          <Text style={styles.menuText}>Notifications Push</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: C.border, true: `${C.primary}99` }}
            thumbColor={notificationsEnabled ? C.primary : C.surfaceHigh}
          />
        </View>
      </View>

      {/* ─── SECTION DANGER ─────────────────────────────────── */}
      <SectionTitle label="Zone de danger" icon="alert-outline" danger />
      <View style={[styles.card, styles.dangerCard]}>
        <MenuRow
          icon="account-remove-outline"
          label="Supprimer mon compte"
          onPress={confirmDelete}
          danger
        />
      </View>

      {/* ─── DÉCONNEXION ────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => signOutUser()} activeOpacity={0.7}>
        <MaterialCommunityIcons name="logout-variant" size={17} color={C.textMuted} />
        <Text style={styles.logoutLabel}>Se déconnecter</Text>
      </TouchableOpacity>

    </ScrollView>


  );
}