// app/(tabs)/psntrophies.tsx
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCustomTheme } from '../../context/ThemeContext';
import { getCollectionStyles } from '../../styles/psntrophies.styles';

export default function PsnTrophiesScreen() {
  const { theme: currentTheme } = useCustomTheme();
  
  const styles = useMemo(() => 
    getCollectionStyles(currentTheme, currentTheme.trophies, currentTheme.trophiesDim), 
  [currentTheme]);

  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Nouveaux états pour la recherche et le tri
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'title'>('recent');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // On récupère toutes les données sans trier côté serveur, on gère le tri en Javascript
      const { data, error } = await supabase
        .from('user_psn_games')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des jeux :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGames();
  };

  // Traitement, filtrage et tri des trophées
  const getProcessedGames = () => {
    let filtered = games.filter(game =>
      game.game_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case 'title':
        return filtered.sort((a, b) => a.game_name.localeCompare(b.game_name));
      case 'progress':
        return filtered.sort((a, b) => b.progress - a.progress);
      case 'recent':
      default:
        // Tri du plus récent au plus ancien basé sur la date de création en base
        return filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
  };

  const processedGames = getProcessedGames();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={currentTheme.trophies} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Le composant Stack.Screen a été supprimé. 
        Le layout global gérera l'affichage du logo GPlayed et de l'avatar.
      */}

      <FlatList
        data={processedGames}
        keyExtractor={(item) => item.np_communication_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme.trophies} />
        }
        
        ListHeaderComponent={
          <View>
            {/* 1. Titre de la page avec compteurs */}
            <View style={styles.headerRow}>
              <View>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.title}>
                    Mes <Text style={styles.usernameHighlight}>Trophées</Text>
                  </Text>
                </View>
                <Text style={styles.count}>
                  <Text style={styles.countNum}>{processedGames.length}</Text>
                  {` jeu${processedGames.length > 1 ? 'x' : ''} synchronisé${processedGames.length > 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>

            {/* 2. Barre de recherche et bouton de tri */}
            {games.length > 0 && (
              <View style={styles.searchRow}>
                <View style={styles.collectionSearchContainer}>
                  <MaterialCommunityIcons name="magnify" size={18} color={currentTheme.textSecondary} />
                  <TextInput
                    style={styles.collectionSearchInput}
                    placeholder="Rechercher un jeu..."
                    placeholderTextColor={currentTheme.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <MaterialCommunityIcons name="close-circle" size={16} color={currentTheme.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Bouton pour changer de tri rapidement */}
                <TouchableOpacity 
                  style={styles.sortButton} 
                  onPress={() => setSortBy(sortBy === 'recent' ? 'progress' : sortBy === 'progress' ? 'title' : 'recent')}
                >
                  <MaterialCommunityIcons 
                    name={sortBy === 'recent' ? 'clock-outline' : sortBy === 'progress' ? 'trophy-outline' : 'sort-alphabetical-variant'} 
                    size={22} 
                    color={currentTheme.trophies} 
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        }

        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="controller-classic-outline" size={54} color={currentTheme.textMuted} />
            <Text style={styles.emptyText}>Aucun jeu synchronisé.</Text>
            <Text style={styles.emptySubText}>
              Rendez-vous dans l'onglet Profil pour renseigner votre pseudo PSN et lancer la synchronisation.
            </Text>
          </View>
        }

        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.game_image_url }} style={styles.cover} />
            
            <View style={styles.info}>
              <Text style={styles.titleCard} numberOfLines={1}>
                {item.game_name}
              </Text>
              
              <View style={styles.statsRow}>
                <MaterialCommunityIcons 
                  name={item.progress === 100 ? "trophy" : "trophy-outline"} 
                  size={15} 
                  /* On donne une couleur spéciale (ex: le mint de l'application) si le jeu est platiné */
                  color={item.progress === 100 ? currentTheme.primary : "#FFD700"} 
                />
                <Text style={styles.statsText}>
                  {item.earned_trophies} / {item.total_trophies}
                </Text>
              </View>

              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
              </View>
            </View>

            <Text style={styles.progressText}>{item.progress}%</Text>
          </View>
        )}
      />
    </View>
  );
}