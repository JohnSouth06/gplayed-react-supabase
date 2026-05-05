import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../../assets/images/logo.svg';
import { useCustomTheme } from '../../context/ThemeContext'; // NOUVEAU

// ─── Composant Avatar dans le header ────────────────────────────────────────
function HeaderAvatar() {
  const { theme: currentTheme } = useCustomTheme(); // NOUVEAU
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setAvatarUrl(data.avatar_url ?? null);
        setInitials(data.username?.charAt(0).toUpperCase() ?? '');
      }
    })();
  }, []);

  return (
    <TouchableOpacity
      onPress={() => router.push('/profile')}
      style={avatarStyles.touchable}
      activeOpacity={0.8}
    >
      {/* Utilisation de currentTheme pour l'anneau */}
      <View style={[avatarStyles.ring, { borderColor: `${currentTheme.primary}66` }]}>
        <View style={[avatarStyles.inner, { backgroundColor: currentTheme.surface }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={avatarStyles.image} />
          ) : (
            <MaterialCommunityIcons
              name={initials ? undefined : 'account'}
              size={initials ? undefined : 20}
              color={currentTheme.primary}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Composant icône de tab bar ──────────────────────────────────────────────
type TabIconProps = {
  name: string;
  color: string;
  focused: boolean;
};

function TabIcon({ name, color, focused }: TabIconProps) {
  const { theme: currentTheme } = useCustomTheme();

  return (
    <View style={[
      tabIconStyles.wrapper, 
      focused && { backgroundColor: `${currentTheme.primary}14` } // Fond dynamique
    ]}>
      <MaterialCommunityIcons name={name as any} size={24} color={color} />
      {focused && <View style={[tabIconStyles.dot, { backgroundColor: currentTheme.primary }]} />}
    </View>
  );
}

// ─── Layout principal ────────────────────────────────────────────────────────
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme: currentTheme } = useCustomTheme(); 

  return (   
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: currentTheme.bg,
          elevation: 0,
          shadowOpacity: 0,
          height: 108,
        },
        headerTitleAlign: 'center',
        headerTitle: () => <Logo width={138} height={35} color={currentTheme.logo} fill={currentTheme.primary} />, 
        headerRight: () => <HeaderAvatar />,
        headerTitleContainerStyle: { paddingBottom: 12 },
        headerRightContainerStyle: { paddingBottom: 12 },
        headerShadowVisible: false,

        tabBarStyle: {
          backgroundColor: currentTheme.bg,
          borderTopWidth: 0,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
          paddingHorizontal: 8,
        },
        tabBarActiveTintColor: currentTheme.primary,
        tabBarInactiveTintColor: currentTheme.textSecondary,
      }}
    >
      {/* ─── Écrans masqués du menu ───── */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerTitle: 'Mon Profil',
        }}
      />
      <Tabs.Screen name="search" options={{ href: null }} />

      {/* ─── Écrans visibles dans le menu ───── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Collection',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="gamepad-variant-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="heart-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="psntrophies"
        options={{
          title: 'Trophées',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="trophy-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chart-areaspline-variant" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// ─── Styles de base (Propriétés non-couleurs uniquement) ─────────────────────
const avatarStyles = StyleSheet.create({
  touchable: { marginRight: 18 },
  ring: { width: 38, height: 38, borderRadius: 12, borderWidth: 1.5, padding: 2 },
  inner: { flex: 1, borderRadius: 9, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%', borderRadius: 9 },
});

const tabIconStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', width: 48, height: 40, borderRadius: 14, gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});