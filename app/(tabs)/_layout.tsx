import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../../assets/images/logo.svg';

// ─── Design Tokens (partagés avec index.tsx) ────────────────────────────────
const C = {
  bg: '#1e1e1e',
  surface: '#272727',
  border: '#3D3D3D',
  primary: '#4CE5AE',
  textSecondary: '#7A8C86',
};

// ─── Composant Avatar dans le header ────────────────────────────────────────
function HeaderAvatar() {
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
      <View style={avatarStyles.ring}>
        <View style={avatarStyles.inner}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={avatarStyles.image} />
          ) : (
            <MaterialCommunityIcons
              name={initials ? undefined : 'account'}
              size={initials ? undefined : 20}
              color={C.primary}
              // Fallback si pas encore chargé
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const avatarStyles = StyleSheet.create({
  touchable: {
    marginRight: 18,
  },
  ring: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${C.primary}66`,
    padding: 2,
  },
  inner: {
    flex: 1,
    borderRadius: 9,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
});

// ─── Composant icône de tab bar ──────────────────────────────────────────────
type TabIconProps = {
  name: string;
  color: string;
  focused: boolean;
};

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View style={[tabIconStyles.wrapper, focused && tabIconStyles.wrapperActive]}>
      <MaterialCommunityIcons name={name as any} size={24} color={color} />
      {focused && <View style={tabIconStyles.dot} />}
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 40,
    borderRadius: 14,
    gap: 3,
  },
  wrapperActive: {
    backgroundColor: `${C.primary}14`,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
});

// ─── Layout principal ────────────────────────────────────────────────────────
export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: C.bg,
          elevation: 0,
          shadowOpacity: 0,
          height: 108,
        },
        headerTitleAlign: 'center',
        headerTitle: () => <Logo width={138} height={35} />,
        headerRight: () => <HeaderAvatar />,
        headerTitleContainerStyle: { paddingBottom: 12 },
        headerRightContainerStyle: { paddingBottom: 12 },
        headerShadowVisible: false,

        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopWidth: 0,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
          paddingHorizontal: 8,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textSecondary,
      }}
    >
      <StatusBar style="light" translucent backgroundColor="transparent" />
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