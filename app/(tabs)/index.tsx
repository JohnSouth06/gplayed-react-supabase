import { searchGames } from '@/api/igdb';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

// Options de tri
const SORT_OPTIONS = [
  { id: 'recent', label: 'Ajouts récents', icon: 'clock-outline' },
  { id: 'title', label: 'Nom (A-Z)', icon: 'sort-alphabetical-variant' },
  { id: 'rating', label: 'Note IGDB', icon: 'star-outline' },
  { id: 'playtime', label: 'Temps de jeu', icon: 'timer-outline' },
];

export default function DashboardScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [myGames, setMyGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'Physique' | 'Numérique'>('Physique');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'rating' | 'playtime'>('recent');

  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'manage' | 'info'>('manage');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('games').select('*').eq('user_id', user.id);
      if (error) throw error;
      setMyGames(data || []);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getProcessedGames = () => {
    let filtered = myGames.filter(game =>
      game.format === activeFormat &&
      game.title.toLowerCase().includes(collectionSearchQuery.toLowerCase())
    );

    switch (sortBy) {
      case 'title': return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'rating': return filtered.sort((a, b) => (b.rating_igdb || 0) - (a.rating_igdb || 0));
      case 'playtime': return filtered.sort((a, b) => (b.playtime || 0) - (a.playtime || 0));
      default: return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  };

  const updateGameField = async (field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ [field]: value })
        .eq('id', selectedGame.id);

      if (error) throw error;

      setSelectedGame({ ...selectedGame, [field]: value });
      setMyGames(myGames.map(g => g.id === selectedGame.id ? { ...g, [field]: value } : g));
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  const deleteGame = () => {
    Alert.alert(
      "Supprimer ce jeu ?",
      "Voulez-vous vraiment retirer ce titre de votre collection ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await supabase.from('games').delete().eq('id', selectedGame.id);
            setDetailModalVisible(false);
            fetchGames();
          }
        }
      ]
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await searchGames(searchQuery);

      if (Array.isArray(data)) {
        // Priorité aux éditions standard (sans version_parent)
        const sorted = data.sort((a, b) => {
          if (a.version_parent === null && b.version_parent !== null) return -1;
          if (a.version_parent !== null && b.version_parent === null) return 1;
          return 0;
        });

        // Aplatissement : un résultat par plateforme
        const flattened: any[] = [];
        sorted.forEach(game => {
          if (game.platforms && game.platforms.length > 0) {
            game.platforms.forEach((p: any) => {
              flattened.push({
                ...game,
                selectedPlatform: p.name,
                uniqueSearchId: `${game.id}-${p.id}`
              });
            });
          } else {
            flattened.push({
              ...game,
              selectedPlatform: 'PC',
              uniqueSearchId: game.id.toString()
            });
          }
        });
        setResults(flattened);
      } else {
        setResults([]);
      }
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addGameToCollection = async (game: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");
      const newGame = {
        user_id: user.id,
        igdb_id: game.id,
        title: game.name,
        description: game.summary,
        rating_igdb: game.total_rating,
        cover_url: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
        genres: game.genres?.map((g: any) => g.name) || [],
        platform: game.selectedPlatform, // Utilise la plateforme choisie dans la recherche
        platforms_list: game.platforms?.map((p: any) => p.name) || [],
        game_modes: game.game_modes?.map((m: any) => m.name) || [],
        screenshots: game.screenshots?.map((s: any) => `https:${s.url.replace('t_thumb', 't_1080p')}`) || [],
        developer: game.involved_companies?.find((c: any) => c.developer)?.company.name || null,
        publisher: game.involved_companies?.find((c: any) => c.publisher)?.company.name || null,
        engine: game.game_engines?.[0]?.name || null,
        format: activeFormat,
        status: 'A faire',
        playtime: 0
      };

      // Conflit géré sur user, id du jeu ET plateforme pour autoriser le même jeu sur 2 consoles
      const { error } = await supabase.from('games').upsert(newGame, { onConflict: 'user_id, igdb_id, platform' });
      if (error) throw error;

      setModalVisible(false);
      setSearchQuery('');
      fetchGames();
    } catch (error: any) {
      alert(error.message);
    }
  };

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
      {/* --- DASHBOARD UI --- */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Ma Collection</Text>
          <Text style={styles.count}>{getProcessedGames().length} jeux {activeFormat.toLowerCase()}s</Text>
        </View>
        <TouchableOpacity style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
          <MaterialCommunityIcons name="sort-variant" size={26} color="#4CE5AE" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeFormat === 'Physique' && styles.activeTab]}
          onPress={() => {
            setActiveFormat('Physique');
            setCollectionSearchQuery('');
          }}
        >
          <MaterialCommunityIcons name="disc" size={18} color={activeFormat === 'Physique' ? '#121212' : '#6c7d76'} />
          <Text style={[styles.tabText, activeFormat === 'Physique' && styles.activeTabText]}>Physique</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeFormat === 'Numérique' && styles.activeTab]}
          onPress={() => {
            setActiveFormat('Numérique');
            setCollectionSearchQuery('');
          }}
        >
          <MaterialCommunityIcons name="cloud-download" size={18} color={activeFormat === 'Numérique' ? '#121212' : '#6c7d76'} />
          <Text style={[styles.tabText, activeFormat === 'Numérique' && styles.activeTabText]}>Numérique</Text>
        </TouchableOpacity>
      </View>

      {/* --- BARRE DE RECHERCHE INTERNE --- */}
      <View style={styles.collectionSearchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#6c7d76" />
        <TextInput
          style={styles.collectionSearchInput}
          placeholder={`Chercher un jeu...`}
          placeholderTextColor="#6c7d76"
          value={collectionSearchQuery}
          onChangeText={setCollectionSearchQuery}
          clearButtonMode="while-editing"
        />
        {collectionSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setCollectionSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#6c7d76" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={getProcessedGames()}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchGames} tintColor="#4CE5AE" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setSelectedGame(item); setDetailModalVisible(true); setDetailTab('manage'); }}>
            <Image source={{ uri: item.cover_url }} style={styles.cardCover} resizeMode="cover" />
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardPlatform}>{item.platform}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* --- MODALE DE DÉTAILS --- */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedGame && (
              <>
                <View style={styles.detailHeader}>
                  <Image source={{ uri: selectedGame.cover_url }} style={styles.detailBlurImage} blurRadius={10} />
                  <View style={styles.detailHeaderContent}>
                    <Image source={{ uri: selectedGame.cover_url }} style={styles.detailMainCover} />
                    <View style={styles.detailTitleBox}>
                      <Text style={styles.detailTitle}>{selectedGame.title}</Text>
                      <Text style={styles.detailDev}>{selectedGame.platform}, {selectedGame.developer || "Studio inconnu"}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setDetailModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSubTabs}>
                  <TouchableOpacity style={[styles.subTab, detailTab === 'manage' && styles.activeSubTab]} onPress={() => setDetailTab('manage')}>
                    <Text style={[styles.subTabText, detailTab === 'manage' && styles.activeSubTabText]}>GÉRER</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.subTab, detailTab === 'info' && styles.activeSubTab]} onPress={() => setDetailTab('info')}>
                    <Text style={[styles.subTabText, detailTab === 'info' && styles.activeSubTabText]}>INFOS</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                  {detailTab === 'manage' ? (
                    <View style={styles.manageContainer}>

                      {/* Onglet Format */}
                      <Text style={styles.sectionTitle}>Format</Text>
                      <View style={styles.formatToggle}>
                        <TouchableOpacity style={[styles.formatBtn, selectedGame.format === 'Physique' && styles.activeFormatBtn]} onPress={() => updateGameField('format', 'Physique')}>
                          <Text style={[styles.formatBtnText, selectedGame.format === 'Physique' && styles.activeFormatBtnText]}>Physique</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.formatBtn, selectedGame.format === 'Numérique' && styles.activeFormatBtn]} onPress={() => updateGameField('format', 'Numérique')}>
                          <Text style={[styles.formatBtnText, selectedGame.format === 'Numérique' && styles.activeFormatBtnText]}>Numérique</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Sélecteur de Plateforme */}
                      <Text style={styles.sectionTitle}>Plateforme</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                        {selectedGame.platforms_list?.map((p: string) => (
                          <TouchableOpacity
                            key={p}
                            style={[styles.pill, selectedGame.platform === p && styles.activePill]}
                            onPress={() => updateGameField('platform', p)}
                          >
                            <Text style={[styles.pillText, selectedGame.platform === p && styles.activePillText]}>{p}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <Text style={styles.sectionTitle}>Statut</Text>
                      <View style={styles.statusGrid}>
                        {['A faire', 'En cours', 'Terminé', 'Platiné - 100%', 'Abandonné'].map((s) => (
                          <TouchableOpacity
                            key={s}
                            style={[styles.statusOption, selectedGame.status === s && { backgroundColor: getStatusColor(s) }]}
                            onPress={() => updateGameField('status', s)}
                          >
                            <Text style={[styles.statusOptionText, selectedGame.status === s && { color: '#121212' }]}>{s}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.sectionTitle}>Temps de jeu (minutes)</Text>
                      <View style={styles.playtimeRow}>
                        <MaterialCommunityIcons name="timer-outline" size={24} color="#4CE5AE" />
                        <TextInput
                          style={styles.playtimeInput}
                          keyboardType="numeric"
                          value={selectedGame.playtime?.toString()}
                          onChangeText={(v) => updateGameField('playtime', parseInt(v) || 0)}
                        />
                        <Text style={styles.playtimeLabel}>min</Text>
                      </View>

                      <TouchableOpacity style={styles.deleteBtn} onPress={deleteGame}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ff4444" />
                        <Text style={styles.deleteBtnText}>Supprimer de la collection</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.infoContainer}>
                      <Text style={styles.sectionTitle}>Description</Text>
                      <Text style={styles.descriptionText}>{selectedGame.description || "Aucune description disponible."}</Text>

                      <Text style={styles.sectionTitle}>Détails techniques</Text>
                      <View style={styles.techGrid}>
                        <DetailRow label="Éditeur" value={selectedGame.publisher} />
                        <DetailRow label="Moteur" value={selectedGame.engine} />
                        <DetailRow label="Genres" value={selectedGame.genres?.join(', ')} />
                        <DetailRow label="Note IGDB" value={selectedGame.rating_igdb ? `${Math.round(selectedGame.rating_igdb)}%` : null} />
                      </View>

                      {selectedGame.screenshots?.length > 0 && (
                        <>
                          <Text style={styles.sectionTitle}>Captures d'écran</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.screenshotScroll}>
                            {selectedGame.screenshots.map((url: string, index: number) => (
                              <Image key={index} source={{ uri: url }} style={styles.screenshotImg} />
                            ))}
                          </ScrollView>
                        </>
                      )}
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODALE DE TRI */}
      <Modal visible={sortModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
          <View style={styles.sortModalContent}>
            <Text style={styles.modalTitle}>Trier par</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.sortOption, sortBy === option.id && styles.activeSortOption]}
                onPress={() => { setSortBy(option.id as any); setSortModalVisible(false); }}
              >
                <MaterialCommunityIcons name={option.icon as any} size={20} color={sortBy === option.id ? '#4CE5AE' : '#fff'} />
                <Text style={[styles.sortOptionText, sortBy === option.id && styles.activeSortOptionText]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODALE DE RECHERCHE */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalSearchContainer}>
          <View style={styles.modalSearchContent}>
            <View style={styles.searchHeader}>
              <TextInput
                style={styles.searchInput}
                placeholder="Chercher un jeu sur IGDB..."
                placeholderTextColor="#6c7d76"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus
              />
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeText}>Fermer</Text></TouchableOpacity>
            </View>
            {searching ? <ActivityIndicator color="#4CE5AE" style={{ marginTop: 20 }} /> : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.uniqueSearchId}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.searchItem} onPress={() => addGameToCollection(item)}>
                    <Image source={item.cover?.url ? { uri: `https:${item.cover.url}` } : require('../../assets/images/icon.png')} style={styles.searchThumbnail} />
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={styles.searchTitle}>{item.name}</Text>
                      <Text style={styles.searchPlatform}>{item.selectedPlatform}</Text>
                    </View>
                    <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#4CE5AE" />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialCommunityIcons name="plus" size={30} color="black" />
      </TouchableOpacity>
    </View>
  );
}

const DetailRow = ({ label, value }: { label: string, value: any }) => {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  count: { color: '#6c7d76', fontSize: 14, fontWeight: '600' },
  sortButton: { backgroundColor: '#1e1e1e', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#333' },

  tabsContainer: { flexDirection: 'row', backgroundColor: '#1e1e1e', borderRadius: 14, padding: 4, marginBottom: 15 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 11, gap: 8 },
  activeTab: { backgroundColor: '#4CE5AE' },
  tabText: { color: '#6c7d76', fontWeight: 'bold', fontSize: 14 },
  activeTabText: { color: '#121212' },

  collectionSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 45,
    borderWidth: 1,
    borderColor: '#222',
  },
  collectionSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
  },

  listContent: { paddingBottom: 100 },
  row: { justifyContent: 'space-between' },
  card: { width: COLUMN_WIDTH, backgroundColor: '#1e1e1e', borderRadius: 18, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  cardCover: { width: '100%', height: COLUMN_WIDTH * 1.4 },
  cardInfo: { padding: 12 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  cardPlatform: { color: '#6c7d76', fontSize: 11, marginTop: 4, fontWeight: '600' },
  statusBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#4CE5AE', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8 },

  detailModalOverlay: { flex: 1, backgroundColor: '#121212' },
  detailModalContent: { flex: 1 },
  detailHeader: { height: height * 0.35, justifyContent: 'flex-end' },
  detailBlurImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.5 },
  detailHeaderContent: { flexDirection: 'row', padding: 20, alignItems: 'center', gap: 20 },
  detailMainCover: { width: 110, height: 155, borderRadius: 12, elevation: 10 },
  detailTitleBox: { flex: 1 },
  detailTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 10 },
  detailDev: { color: '#4CE5AE', fontSize: 14, fontWeight: '600', marginTop: 5 },
  closeDetailBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  detailSubTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333' },
  subTab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeSubTab: { borderBottomWidth: 3, borderBottomColor: '#4CE5AE' },
  subTabText: { color: '#6c7d76', fontWeight: 'bold', letterSpacing: 1 },
  activeSubTabText: { color: '#4CE5AE' },
  detailScroll: { flex: 1, padding: 20 },
  sectionTitle: { color: '#4CE5AE', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15, marginTop: 10, letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  sortModalContent: { backgroundColor: '#1e1e1e', width: '80%', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  sortOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 8, gap: 12 },
  activeSortOption: { backgroundColor: 'rgba(76, 229, 174, 0.1)' },
  sortOptionText: { color: '#fff', fontSize: 16 },
  activeSortOptionText: { color: '#4CE5AE', fontWeight: 'bold' },

  modalSearchContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  modalSearchContent: { backgroundColor: '#1e1e1e', height: '92%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  searchInput: { flex: 1, backgroundColor: '#121212', color: '#fff', padding: 16, borderRadius: 15, marginRight: 15, borderWidth: 1, borderColor: '#333' },
  closeText: { color: '#4CE5AE', fontWeight: 'bold' },
  searchItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a', alignItems: 'center' },
  searchThumbnail: { width: 50, height: 70, borderRadius: 8, backgroundColor: '#121212' },
  searchTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  searchPlatform: { color: '#4CE5AE', fontSize: 12, fontWeight: 'bold', marginTop: 2 },

  manageContainer: { paddingBottom: 50 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
  statusOption: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  statusOptionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  playtimeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 15, borderRadius: 15, gap: 15, marginBottom: 25 },
  playtimeInput: { flex: 1, color: '#fff', fontSize: 18, fontWeight: 'bold' },
  playtimeLabel: { color: '#6c7d76', fontWeight: 'bold' },
  formatToggle: { flexDirection: 'row', backgroundColor: '#1e1e1e', borderRadius: 12, padding: 5, marginBottom: 30 },
  formatBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeFormatBtn: { backgroundColor: '#333' },
  formatBtnText: { color: '#6c7d76', fontWeight: 'bold' },
  activeFormatBtnText: { color: '#fff' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#ff444433' },
  deleteBtnText: { color: '#ff4444', fontWeight: 'bold' },

  infoContainer: { paddingBottom: 50 },
  descriptionText: { color: '#ccc', fontSize: 15, lineHeight: 24, marginBottom: 30 },
  techGrid: { backgroundColor: '#1e1e1e', padding: 20, borderRadius: 20, marginBottom: 30 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  detailLabel: { color: '#6c7d76', fontSize: 13, fontWeight: 'bold' },
  detailValue: { color: '#fff', fontSize: 13, flex: 1, textAlign: 'right', marginLeft: 20 },
  screenshotScroll: { marginTop: 10 },
  screenshotImg: { width: 300, height: 170, borderRadius: 15, marginRight: 15, backgroundColor: '#1e1e1e' },

  pillScroll: { flexDirection: 'row', marginBottom: 15 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginRight: 10 },
  activePill: { borderColor: '#4CE5AE', backgroundColor: 'rgba(76, 229, 174, 0.1)' },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  activePillText: { color: '#4CE5AE' }
});