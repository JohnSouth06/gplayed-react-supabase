// app/(tabs)/psntrophies.tsx
import { syncGameTrophies } from '@/api/psn';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  
  // Nouveaux états pour la modale
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [trophiesList, setTrophiesList] = useState<any[]>([]);
  const [loadingTrophies, setLoadingTrophies] = useState(false);

  // Fonction pour ouvrir la modale et charger les trophées
  const handleOpenGame = async (game: any) => {
    setSelectedGame(game);
    setModalVisible(true);
    setLoadingTrophies(true);

    try {
      // 1. Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Aller chercher le pseudo PSN dans la table de profil
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles') 
        .select('psn_id') 
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile?.psn_id) {
        console.error("Pseudo PSN introuvable !");
        // Tu pourrais afficher une petite alerte ici
        setLoadingTrophies(false);
        return; 
      }

      const userPsnId = userProfile.psn_id;

      // 3. On déclenche la synchro paresseuse avec le VRAI pseudo
      await syncGameTrophies(user.id, userPsnId, game.np_communication_id); 

      // On récupère la liste fusionnée depuis nos tables Supabase
      const { data: globalTrophies } = await supabase
        .from('psn_trophies')
        .select('*')
        .eq('np_communication_id', game.np_communication_id);

      const { data: userTrophies } = await supabase
        .from('user_psn_trophies')
        .select('*')
        .eq('np_communication_id', game.np_communication_id)
        .eq('user_id', user.id);

      if (globalTrophies) {
        const merged = globalTrophies.map(gt => {
          const ut = userTrophies?.find(u => u.trophy_id === gt.trophy_id);
          return { ...gt, earned: ut ? ut.earned : false };
        });

        // TRI : Non obtenus en premier, puis obtenus
        merged.sort((a, b) => (a.earned === b.earned ? 0 : a.earned ? 1 : -1));
        setTrophiesList(merged);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTrophies(false);
    }
  };

  const searchYoutube = (gameName: string, trophyName: string) => {
    const query = encodeURIComponent(`${gameName} ${trophyName} trophy guide`);
    Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
  };
  
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
          <TouchableOpacity style={styles.card} onPress={() => handleOpenGame(item)} activeOpacity={0.7}>
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
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: currentTheme.bg, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: currentTheme.textPrimary }}>
              {selectedGame?.game_name}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={28} color={currentTheme.textPrimary} />
            </TouchableOpacity>
          </View>

          {loadingTrophies ? (
            <ActivityIndicator size="large" color={currentTheme.trophies} style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={trophiesList}
              keyExtractor={(item) => item.trophy_id.toString()}
              renderItem={({ item }) => (
                <View style={{
                  flexDirection: 'row', 
                  padding: 15, 
                  backgroundColor: currentTheme.surface, 
                  borderRadius: 12, 
                  marginBottom: 10,
                  alignItems: 'center',
                  opacity: item.earned ? 0.7 : 1 
                }}>
                  <Image source={{ uri: item.trophy_icon_url }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 15 }} />
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: currentTheme.textPrimary, fontWeight: 'bold', fontSize: 16 }}>{item.trophy_name}</Text>
                    <Text style={{ color: currentTheme.textSecondary, fontSize: 13, marginTop: 4 }}>{item.trophy_description}</Text>
                  </View>

                  {item.earned ? (
                    // Coche d'accomplissement (couleur mint/primaire de ton thème)
                    <MaterialCommunityIcons name="check-circle" size={28} color={currentTheme.primary} />
                  ) : (
                    // Bouton YouTube pour les trophées non obtenus
                    <TouchableOpacity onPress={() => searchYoutube(selectedGame.game_name, item.trophy_name)} style={{ padding: 8 }}>
                      <MaterialCommunityIcons name="youtube" size={28} color="#FF0000" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}