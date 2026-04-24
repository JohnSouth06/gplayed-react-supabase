import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router'; // Ajout de useRouter
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../../assets/images/logo.svg';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter(); // Initialisation du router

  // Composant Avatar intégré au Header
  const HeaderAvatar = () => (
    <TouchableOpacity 
      onPress={() => router.push('/profile')} // Navigation vers le profil
      style={{ marginRight: 20 }}
    >
      <View style={{ 
        width: 38, 
        height: 38, 
        borderRadius: 19, 
        backgroundColor: '#1e1e1e', 
        borderWidth: 1.5, 
        borderColor: '#4CE5AE',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Tu pourras plus tard afficher l'initiale ou l'image réelle ici */}
        <MaterialCommunityIcons name="account" size={22} color="#4CE5AE" />
      </View>
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: '#121212',
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 110,
        },
        headerTitleAlign: 'center',
        headerTitle: () => <Logo width={120} height={30} />,
        headerRight: () => <HeaderAvatar />, // Notre avatar cliquable
        headerTitleContainerStyle: { paddingBottom: 15 },
        headerRightContainerStyle: { paddingBottom: 15 },

        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#4CE5AE',
        tabBarInactiveTintColor: '#6c7d76',
      }}
    >
      {/* ÉCRANS INVISIBLES DANS LE MENU BAS */}
      <Tabs.Screen 
        name="profile" 
        options={{ 
          href: null, // Masque l'onglet du menu
          headerTitle: 'Mon Profil' 
        }} 
      />
      <Tabs.Screen name="search" options={{ href: null }} />

      {/* ÉCRANS VISIBLES DANS LE MENU BAS */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jeux',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="gamepad-variant" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Souhaits',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="hand-heart-outline" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="psntrophies"
        options={{
          title: 'Trophées',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="trophy" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chart-areaspline-variant" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}