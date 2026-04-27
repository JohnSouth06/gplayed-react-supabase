import { deleteAccount, signOutUser } from '@/api/auth';
import { updateAvatarUrl } from '@/api/user';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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
  redDim: 'rgba(255,76,76,0.08)',
};

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

const pickAndUploadAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled || !result.assets[0].base64 || !userId) return;

    setUploading(true);
    setProgress(0.1);

    try {
      const image = result.assets[0];
      const fileExt = image.uri.split('.').pop()?.toLowerCase();
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

      setProgress(0.3);
      // 1. Upload au storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(image.base64), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;
      setProgress(0.6);

      // 2. Récupération URL et Update DB via notre API
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await updateAvatarUrl(userId, publicUrl);

      setProgress(1);
      
      // Forcer le rafraîchissement local avec un cache-buster
      const finalUrl = `${publicUrl}?t=${new Date().getTime()}`;
      setProfile(prev => prev ? { ...prev, avatar_url: finalUrl } : null);

      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    } catch (e: any) {
      Alert.alert("Erreur de mise à jour", e.message);
      setUploading(false);
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


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

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

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
    marginTop: 24,
    paddingHorizontal: 2,
  },
  label: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

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

const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 20,
  },

  // HEADER
  header: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 20,
  },
  avatarRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: `${C.primary}66`,
    padding: 3,
    marginBottom: 4,
  },
  avatarWrapper: {
    flex: 1,
    borderRadius: 55,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  avatarLetter: {
    color: C.primary,
    fontSize: 42,
    fontWeight: '800',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(39,39,39,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 55,
  },
  editBadge: {
    position: 'absolute',
    bottom: 6,
    right: 0,
    backgroundColor: C.primary,
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: C.bg,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  progressTrack: {
    width: 120,
    height: 3,
    backgroundColor: C.border,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: 2,
  },
  usernamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  username: {
    color: C.textPrimary,
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  memberLabel: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '300',
    marginTop: 5,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // CARD (contenant de section)
  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  dangerCard: {
    borderColor: `${C.red}33`,
    backgroundColor: C.redDim,
  },

  // MENU ITEM (pour le Switch)
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  // LOGOUT
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingVertical: 12,
  },
  logoutLabel: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});