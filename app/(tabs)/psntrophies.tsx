// app/(tabs)/psntrophies.tsx
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Linking, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'title'>('recent');
  
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [trophiesList, setTrophiesList] = useState<any[]>([]);
  const [loadingTrophies, setLoadingTrophies] = useState(false);

  const handleOpenGame = async (game: any) => {
    setSelectedGame(game);
    setModalVisible(true);
    setLoadingTrophies(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles') 
        .select('psn_id') 
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile?.psn_id) {
        Alert.alert("Action requise", "Pseudo PSN introuvable ! Renseignez-le dans votre profil.");
        setLoadingTrophies(false);
        return; 
      }

      const userPsnId = userProfile.psn_id;

      // 1. On délègue la synchronisation au serveur VPS (comme dans profile.tsx)
      const response = await fetch('https://api.g-played.com/sync-game-trophies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          psnId: userPsnId,
          game: game,
          language: "fr-FR" 
        })
      });

      const syncResult = await response.json();
      
      // 2. Si le serveur renvoie une erreur, on l'affiche
      if (!syncResult.success) {
         Alert.alert("Erreur de synchronisation PSN", syncResult.error || "Erreur serveur.");
         setLoadingTrophies(false);
         return; 
      }

      // 3. La synchro serveur est terminée, on récupère les données dans Supabase
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
          const ut = userTrophies?.find(u => String(u.trophy_id) === String(gt.trophy_id));
          return { ...gt, earned: ut ? ut.earned : false };
        });

        merged.sort((a, b) => (a.earned === b.earned ? 0 : a.earned ? 1 : -1));
        setTrophiesList(merged);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de joindre le serveur de synchronisation.");
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

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedGame && (
              <>
                {/* HEADER HARMONISÉ (Style index.tsx) */}
                <View style={styles.detailHeader}>
                  <Image source={{ uri: selectedGame.game_image_url }} style={styles.detailBlurImage} blurRadius={3} />
                  <View style={styles.detailHeaderDim} />
                  <View style={styles.detailHeaderContent}>
                    <Image source={{ uri: selectedGame.game_image_url }} style={styles.detailMainCover} />
                    <View style={styles.detailTitleBox}>
                      <Text style={styles.detailTitle} numberOfLines={2}>{selectedGame.game_name}</Text>
                      <View style={styles.detailPlatformRow}>
                        <MaterialCommunityIcons name="sony-playstation" size={13} color={currentTheme.trophies} />
                        <Text style={styles.detailDev}>PlayStation Network</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Bouton de fermeture identique à index.tsx */}
                  <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={20} color={currentTheme.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* CONTENU DE LA MODALE */}
                <View style={{ flex: 1, paddingHorizontal: 15, paddingTop: 20 }}>
                  {loadingTrophies ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <ActivityIndicator size="large" color={currentTheme.trophies} />
                      <Text style={{ color: currentTheme.textSecondary, marginTop: 15 }}>Synchronisation en cours...</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={trophiesList}
                      keyExtractor={(item) => String(item.trophy_id)}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 40 }}
                      renderItem={({ item }) => (
                        <View style={{
                          flexDirection: 'row', 
                          padding: 15, 
                          backgroundColor: currentTheme.surface, 
                          borderRadius: 16, 
                          marginBottom: 12,
                          alignItems: 'center',
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                          opacity: item.earned ? 0.6 : 1
                        }}>
                          <Image source={{ uri: item.trophy_icon_url }} style={{ width: 55, height: 55, borderRadius: 10, marginRight: 15 }} />
                          
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: currentTheme.textPrimary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16, marginBottom: 4 }}>
                              {item.trophy_name}
                            </Text>
                            <Text style={{ color: currentTheme.textSecondary, fontSize: 13, lineHeight: 18 }}>
                              {item.trophy_description}
                            </Text>
                          </View>

                          <View style={{ marginLeft: 10 }}>
                            {item.earned ? (
                              <MaterialCommunityIcons name="check-decagram" size={32} color={currentTheme.primary || "#4CAF50"} />
                            ) : (
                              <TouchableOpacity 
                                onPress={() => searchYoutube(selectedGame.game_name, item.trophy_name)} 
                                style={{ padding: 8, backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: 12 }}
                              >
                                <MaterialCommunityIcons name="youtube" size={26} color="#FF0000" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      )}
                    />
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}