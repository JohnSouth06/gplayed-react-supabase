import { searchGames } from '@/api/igdb';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function DashboardScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Fonction de recherche déclenchée à la validation du clavier
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await searchGames(searchQuery);
      
      // On s'assure de recevoir un tableau pour éviter les crashs de FlatList
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

  // Ajout du jeu sélectionné dans la table "games" de Supabase
  const addGameToCollection = async (game: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const newGame = {
        user_id: user.id,
        title: game.name,
        description: game.summary,
        rating_igdb: game.total_rating,
        
        // Image de couverture
        cover_url: game.cover?.url 
          ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` 
          : null,

        // Tableaux de chaînes (Text[])
        genres: game.genres?.map((g: any) => g.name) || [],
        
        // Récupération des modes de jeu (Array de noms)
        game_modes: game.game_modes?.map((m: any) => m.name) || [],

        // Récupération des captures d'écran (Conversion en URLs HD)
        screenshots: game.screenshots?.map((s: any) => 
          `https:${s.url.replace('t_thumb', 't_1080p')}`
        ) || [],

        // Entreprises (Développeur et Éditeur)
        developer: game.involved_companies?.find((c: any) => c.developer)?.company.name || null,
        publisher: game.involved_companies?.find((c: any) => c.publisher)?.company.name || null,

        // Moteur de jeu (On prend le premier de la liste s'il existe)
        engine: game.engines?.[0]?.name || null,

        // Valeurs par défaut pour le suivi
        format: 'Numérique',
        status: 'A faire',
        playtime: 0
      };

      const { error } = await supabase.from('games').insert([newGame]);
      if (error) throw error;

      alert(`${game.name} a été ajouté avec succès !`);
      setModalVisible(false);
    } catch (error: any) {
      alert("Erreur lors de l'ajout : " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ma Collection</Text>

      {/* Bouton d'ajout flottant */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={30} color="black" />
      </TouchableOpacity>

      {/* Modale de recherche IGDB */}
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.searchHeader}>
              <TextInput 
                style={styles.searchInput}
                placeholder="Quel jeu cherches-tu ?"
                placeholderTextColor="#6c7d76"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus
                returnKeyType="search"
              />
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setResults([]);
                setSearchQuery('');
              }}>
                <Text style={styles.closeText}>Fermer</Text>
              </TouchableOpacity>
            </View>

            {searching ? (
              <ActivityIndicator color="#4CE5AE" style={{ marginTop: 40 }} />
            ) : (
              <FlatList 
                data={results}
                keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => {
                  // Préparation sécurisée de l'image
                  const imageUrl = item.cover?.url 
                    ? `https:${item.cover.url.replace('t_thumb', 't_cover_big')}` 
                    : null;

                  return (
                    <TouchableOpacity 
                      style={styles.gameItem}
                      onPress={() => addGameToCollection(item)}
                    >
                      {imageUrl ? (
                        <Image 
                          source={{ uri: imageUrl }} 
                          style={styles.thumbnail} 
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                          <MaterialCommunityIcons name="image-off" size={24} color="#333" />
                        </View>
                      )}
                      
                      <View style={styles.gameInfo}>
                        <Text style={styles.gameTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.gameGenre}>
                          {item.genres?.[0]?.name || 'Genre non spécifié'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#333" />
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => (
                  !searching && searchQuery.length > 0 ? (
                    <Text style={styles.emptyText}>Aucun jeu trouvé pour cette recherche.</Text>
                  ) : null
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginTop: 40, marginBottom: 20 },
  fab: { 
    position: 'absolute', bottom: 30, right: 30, 
    backgroundColor: '#4CE5AE', width: 64, height: 64, 
    borderRadius: 32, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6
  },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#1e1e1e', 
    height: '92%', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 24,
    borderWidth: 1,
    borderColor: '#333'
  },
  searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  searchInput: { 
    flex: 1, 
    backgroundColor: '#121212', 
    color: '#fff', 
    padding: 16, 
    borderRadius: 15, 
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16
  },
  closeText: { color: '#4CE5AE', fontWeight: 'bold', fontSize: 16 },
  gameItem: { 
    flexDirection: 'row', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#2a2a2a',
    alignItems: 'center' 
  },
  thumbnail: { 
    width: 65, 
    height: 90, 
    borderRadius: 10, 
    backgroundColor: '#121212' 
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  gameInfo: { flex: 1, marginLeft: 16 },
  gameTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  gameGenre: { color: '#6c7d76', fontSize: 14 },
  emptyText: { color: '#6c7d76', textAlign: 'center', marginTop: 40, fontSize: 15 }
});