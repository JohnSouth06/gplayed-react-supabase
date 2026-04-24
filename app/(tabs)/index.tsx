import { searchGames } from '@/api/igdb';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2; // Calcul pour la grille à 2 colonnes

export default function DashboardScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // États pour la collection personnelle
  const [myGames, setMyGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  // Récupération des jeux depuis Supabase
  const fetchGames = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyGames(data || []);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGames();
  };

  // Recherche IGDB
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await searchGames(searchQuery);
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
        if (data.message) alert("Erreur IGDB : " + data.message);
      }
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Ajout du jeu avec toutes les métadonnées (Corrigé)
  const addGameToCollection = async (game: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const newGame = {
        user_id: user.id,
        title: game.name,
        description: game.summary,
        rating_igdb: game.total_rating,
        cover_url: game.cover?.url 
          ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` 
          : null,
        
        // Mapping des tableaux et objets complexes IGDB
        genres: game.genres?.map((g: any) => g.name) || [],
        game_modes: game.game_modes?.map((m: any) => m.name) || [],
        screenshots: game.screenshots?.map((s: any) => 
          `https:${s.url.replace('t_thumb', 't_1080p')}`
        ) || [],
        
        // Entreprises (Développeur / Éditeur)
        developer: game.involved_companies?.find((c: any) => c.developer)?.company.name || null,
        publisher: game.involved_companies?.find((c: any) => c.publisher)?.company.name || null,
        
        // Moteur (game_engines)
        engine: game.game_engines?.[0]?.name || null,
        
        format: 'Numérique',
        status: 'A faire',
        playtime: 0
      };

      const { error } = await supabase.from('games').insert([newGame]);
      if (error) throw error;

      alert(`${game.name} ajouté !`);
      setModalVisible(false);
      setSearchQuery('');
      setResults([]);
      fetchGames(); // Rafraîchit le dashboard
    } catch (error: any) {
      alert("Erreur lors de l'ajout : " + error.message);
    }
  };

  // Couleurs dynamiques selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours': return '#4CE5AE';
      case 'Terminé': return '#3498db';
      case 'Platiné - 100%': return '#f1c40f';
      case 'Abandonné': return '#e74c3c';
      default: return '#6c7d76';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Dashboard */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ma Collection</Text>
        <Text style={styles.count}>{myGames.length} jeux</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#4CE5AE" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={myGames}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CE5AE" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card}>
              <Image 
                source={{ uri: item.cover_url }} 
                style={styles.cardCover} 
                resizeMode="cover"
              />
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="gamepad-variant-outline" size={80} color="#333" />
              <Text style={styles.emptyText}>Ta collection est vide.</Text>
            </View>
          }
        />
      )}

      {/* Bouton Flottant Ajouter */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialCommunityIcons name="plus" size={30} color="black" />
      </TouchableOpacity>

      {/* Modale de Recherche */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.searchHeader}>
              <TextInput 
                style={styles.searchInput}
                placeholder="Nom du jeu..."
                placeholderTextColor="#6c7d76"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus
              />
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Fermer</Text>
              </TouchableOpacity>
            </View>

            {searching ? (
              <ActivityIndicator color="#4CE5AE" style={{ marginTop: 20 }} />
            ) : (
              <FlatList 
                data={results}
                keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                renderItem={({ item }) => {
                  const imageUrl = item.cover?.url 
                    ? `https:${item.cover.url.replace('t_thumb', 't_cover_big')}` 
                    : null;
                  return (
                    <TouchableOpacity 
                      style={styles.searchResultItem}
                      onPress={() => addGameToCollection(item)}
                    >
                      <Image 
                        source={imageUrl ? { uri: imageUrl } : require('../../assets/images/icon.png')} 
                        style={styles.searchThumbnail} 
                      />
                      <View style={styles.searchInfo}>
                        <Text style={styles.searchTitle}>{item.name}</Text>
                        <Text style={styles.searchGenre}>{item.genres?.[0]?.name || 'Jeu'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 50, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  count: { color: '#6c7d76', fontSize: 16, fontWeight: '600' },
  
  // Styles Grille Dashboard
  listContent: { paddingBottom: 100 },
  row: { justifyContent: 'space-between' },
  card: { 
    width: COLUMN_WIDTH, 
    backgroundColor: '#1e1e1e', 
    borderRadius: 16, 
    marginBottom: 20, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333'
  },
  cardCover: { width: '100%', height: COLUMN_WIDTH * 1.4 },
  cardInfo: { padding: 12 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  statusBadge: { 
    position: 'absolute', top: 10, right: 10, 
    paddingHorizontal: 8, paddingVertical: 4, 
    borderRadius: 8
  },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  fab: { 
    position: 'absolute', bottom: 30, right: 30, 
    backgroundColor: '#4CE5AE', width: 64, height: 64, 
    borderRadius: 32, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10
  },

  // Styles Modale de recherche
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e1e1e', height: '92%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  searchInput: { flex: 1, backgroundColor: '#121212', color: '#fff', padding: 16, borderRadius: 15, marginRight: 15, borderWidth: 1, borderColor: '#333' },
  closeText: { color: '#4CE5AE', fontWeight: 'bold' },
  searchResultItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a', alignItems: 'center' },
  searchThumbnail: { width: 50, height: 70, borderRadius: 8, backgroundColor: '#121212' },
  searchInfo: { flex: 1, marginLeft: 15 },
  searchTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  searchGenre: { color: '#6c7d76', fontSize: 13 },

  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#6c7d76', marginTop: 20, fontSize: 16, textAlign: 'center' }
});