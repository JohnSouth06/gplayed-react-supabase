import {
  addGameToCollection,
  getUserCollection,
  removeGameFromCollection,
  updateCollectionEntry
} from '@/api/collection';
import { searchGames } from '@/api/igdb';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
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

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#1e1e1e',
  surface: '#272727',
  surfaceHigh: '#2e2e2e',
  border: '#3D3D3D',
  borderAccent: '#4CE5AE22',
  primary: '#e54c9b',
  primaryDim: 'rgba(229, 76, 160, 0.12)',
  primaryGlow: 'rgba(229, 76, 145, 0.25)',
  textPrimary: '#F0F0F0',
  textSecondary: '#7A8C86',
  textMuted: '#677a73',
  red: '#FF4C4C',
  redDim: 'rgba(255,76,76,0.12)',
  blue: '#72ecfe',
  yellow: '#FFD34C',
  grey: '#c5dcd3',
  pink: '#FF6B9E',
};

// Options de tri modifiées pour la wishlist (retrait note et temps de jeu, ajout date de sortie)
const SORT_OPTIONS = [
  { id: 'recent', label: 'Ajouts récents', icon: 'clock-outline' },
  { id: 'title', label: 'Nom (A-Z)', icon: 'sort-alphabetical-variant' },
  { id: 'release', label: 'Date de sortie', icon: 'calendar' },
];

const MAP_FORMAT_TO_SQL = { 'Physique': 'physical', 'Numérique': 'digital' } as const;
const MAP_SQL_TO_FORMAT = { 'physical': 'Physique', 'digital': 'Numérique' } as const;

export default function WishlistScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [myGames, setMyGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeFormat, setActiveFormat] = useState<'Physique' | 'Numérique'>('Physique');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'release'>('recent');
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'manage' | 'info'>('manage');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const collectionData = await getUserCollection(user.id);
      
      // Filtrage strict pour n'afficher que la wishlist
      const wishlistData = collectionData.filter(item => item.status === 'wishlist');
      
      const formattedCollection = wishlistData.map(item => ({
        ...item,
        title: item.game?.title || 'Titre inconnu',
        cover_url: item.game?.cover_url,
        genres: item.game?.genres,
        rating_igdb: item.game?.rating_igdb,
        platforms_list: item.game?.platforms_list,
        release_date: item.game?.release_date,
        developer: item.game?.developer,
        publisher: item.game?.publisher,
        engine: item.game?.engine,
        description: item.game?.description,
        screenshots: item.game?.screenshots,
        displayFormat: MAP_SQL_TO_FORMAT[item.format as keyof typeof MAP_SQL_TO_FORMAT],
        displayStatus: 'Wishlist'
      }));

      setMyGames(formattedCollection);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();
    
      if (profileData) setUsername(profileData.username);

    } catch (e: any) {
      console.error("Erreur récupération:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getProcessedGames = () => {
    let filtered = myGames.filter(game =>
      game.displayFormat === activeFormat &&
      game.title.toLowerCase().includes(collectionSearchQuery.toLowerCase())
    );
    switch (sortBy) {
      case 'title': return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'release': return filtered.sort((a, b) => new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime());
      default: return filtered.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
    }
  };

  const updateGameField = async (field: 'format' | 'platform', value: any) => {
    try {
      let sqlValue = value;
      if (field === 'format') sqlValue = MAP_FORMAT_TO_SQL[value as keyof typeof MAP_FORMAT_TO_SQL];

      await updateCollectionEntry(selectedGame.id, { [field]: sqlValue });
      
      const displayValue = value; 
      setSelectedGame({ 
        ...selectedGame, 
        [field]: sqlValue, 
        ...(field === 'format' ? { displayFormat: displayValue } : {})
      });
      
      setMyGames(myGames.map(g => g.id === selectedGame.id ? { 
        ...g, 
        [field]: sqlValue,
        ...(field === 'format' ? { displayFormat: displayValue } : {})
      } : g));
      
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  // Fonction spécifique Wishlist : transférer vers la collection
  const moveToCollection = async () => {
    try {
      await updateCollectionEntry(selectedGame.id, { status: 'todo' });
      setDetailModalVisible(false);
      fetchGames(); // Le jeu disparaîtra de la wishlist et apparaîtra dans le dashboard
      Alert.alert("Succès", "Jeu ajouté à votre collection !");
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  const deleteGame = () => {
    Alert.alert(
      "Supprimer ce vœu ?",
      "Voulez-vous vraiment retirer ce titre de votre wishlist ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer", style: "destructive",
          onPress: async () => {
            await removeGameFromCollection(selectedGame.id);
            setDetailModalVisible(false);
            fetchGames();
          }
        }
      ]
    );
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setSelectionMode(false);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const deleteSelectedGames = () => {
    const count = selectedIds.size;
    Alert.alert(
      `Supprimer ${count} vœu${count > 1 ? 'x' : ''} ?`,
      `Voulez-vous vraiment retirer ${count > 1 ? 'ces titres' : 'ce titre'} de votre wishlist ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer", style: "destructive",
          onPress: async () => {
            try {
              const ids = Array.from(selectedIds);
              await Promise.all(ids.map(id => removeGameFromCollection(id)));
              exitSelectionMode();
              fetchGames();
            } catch (e: any) {
              Alert.alert("Erreur", e.message);
            }
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
        const sorted = data.sort((a, b) => {
          if (a.version_parent === null && b.version_parent !== null) return -1;
          if (a.version_parent !== null && b.version_parent === null) return 1;
          return 0;
        });
        const flattened: any[] = [];
        sorted.forEach(game => {
          if (game.platforms && game.platforms.length > 0) {
            game.platforms.forEach((p: any) => {
              flattened.push({ ...game, selectedPlatform: p.name, uniqueSearchId: `${game.id}-${p.id}` });
            });
          } else {
            flattened.push({ ...game, selectedPlatform: 'PC', uniqueSearchId: game.id.toString() });
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

  const handleAddGame = async (gameData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      await addGameToCollection({
        userId: user.id,
        gameData: gameData,
        preferences: {
          format: MAP_FORMAT_TO_SQL[activeFormat],
          status: 'wishlist',
          platform: gameData.selectedPlatform,
          priority: 'Moyenne'
        }
      });
      
      setModalVisible(false);
      setSearchQuery('');
      fetchGames();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const processedGames = getProcessedGames();

  const formatDate = (dateString: string) => {
    if (!dateString) return "Inconnue";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <FlatList
        data={processedGames}
        key={viewMode}
        numColumns={viewMode === 'grid' ? 2 : 1}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchGames} tintColor={C.primary} />}
        
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.title}>Ma <Text style={styles.titleHighlight}>Wishlist</Text></Text>
                </View>
                <Text style={styles.count}>
                  <Text style={styles.countNum}>{processedGames.length}</Text>
                  {' '}jeux convoités ({activeFormat.toLowerCase()})
                </Text>
              </View>
            </View>

            <View style={styles.tabsContainer}>
              {(['Physique', 'Numérique'] as const).map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[styles.tab, activeFormat === format && styles.activeTab]}
                  onPress={() => { setActiveFormat(format); setCollectionSearchQuery(''); }}
                >
                  <MaterialCommunityIcons
                    name={format === 'Physique' ? 'disc' : 'cloud-download-outline'}
                    size={17}
                    color={activeFormat === format ? C.bg : C.textSecondary}
                  />
                  <Text style={[styles.tabText, activeFormat === format && styles.activeTabText]}>
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.searchRow}>
              <View style={styles.collectionSearchContainer}>
                <MaterialCommunityIcons name="magnify" size={18} color={C.textSecondary} />
                <TextInput
                  style={styles.collectionSearchInput}
                  placeholder="Rechercher un jeu..."
                  placeholderTextColor={C.textMuted}
                  value={collectionSearchQuery}
                  onChangeText={setCollectionSearchQuery}
                  clearButtonMode="while-editing"
                />
                {collectionSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setCollectionSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={C.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
                <MaterialCommunityIcons name="sort-variant" size={22} color={C.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => { exitSelectionMode(); setViewMode(v => v === 'grid' ? 'list' : 'grid'); }}
              >
                <MaterialCommunityIcons
                  name={viewMode === 'grid' ? 'view-list-outline' : 'view-grid-outline'}
                  size={22}
                  color={C.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        }

        renderItem={({ item }) => {
          const itemId = item.id.toString();
          const isSelected = selectedIds.has(itemId);
          const pressHandlers = {
            onPress: () => {
              if (selectionMode) { toggleSelection(itemId); }
              else { setSelectedGame(item); setDetailModalVisible(true); setDetailTab('manage'); }
            },
            onLongPress: () => {
              if (!selectionMode) { setSelectionMode(true); setSelectedIds(new Set([itemId])); }
            },
            delayLongPress: 350,
            activeOpacity: 0.8 as number,
          };

          if (viewMode === 'list') {
            return (
              <TouchableOpacity style={[styles.listItem, isSelected && styles.listItemSelected]} {...pressHandlers}>
                {selectionMode && (
                  <View style={[styles.listCheckCircle, isSelected && styles.checkCircleActive]}>
                    {isSelected && <MaterialCommunityIcons name="check" size={14} color={C.bg} />}
                  </View>
                )}
                <View style={styles.listCoverWrapper}>
                  <Image source={{ uri: item.cover_url }} style={styles.listCover} resizeMode="cover" />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.listBadgesRow}>
                    <PlatformBadge platform={item.platform} />
                  </View>
                </View>
                {!selectionMode && (
                  <View style={[styles.listStatusBadge, { backgroundColor: `${C.pink}22`, borderColor: `${C.pink}55` }]}>
                    <MaterialCommunityIcons name="heart" size={13} color={C.pink} />
                    <Text style={[styles.listStatusText, { color: C.pink }]} numberOfLines={1}>Wishlist</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity style={[styles.card, isSelected && styles.cardSelected]} {...pressHandlers}>
              <View style={styles.cardImageWrapper}>
                <Image source={{ uri: item.cover_url }} style={styles.cardCover} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(39,39,39,0.55)', 'rgba(39,39,39,0.92)']} style={styles.cardImageOverlay} />
                {selectionMode && (
                  <View style={styles.selectionOverlay}>
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                      {isSelected && <MaterialCommunityIcons name="check" size={16} color={C.bg} />}
                    </View>
                  </View>
                )}
              </View>
              {!selectionMode && (
                <View style={[styles.statusBadge, { backgroundColor: `${C.bg}90`, borderColor: `${C.pink}90` }]}>
                  <MaterialCommunityIcons name="heart" size={12} color={C.pink} />
                  <Text style={[styles.statusText, { color: C.pink }]}>Wishlist</Text>
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardBadgesRow}>
                  <PlatformBadge platform={item.platform} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="heart-broken" size={48} color={C.textMuted} />
              <Text style={styles.emptyTitle}>Wishlist vide</Text>
              <Text style={styles.emptySubtitle}>Appuyez sur + pour rechercher un jeu</Text>
            </View>
          ) : null
        }
      />

      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedGame && (
              <>
                <View style={styles.detailHeader}>
                  <Image source={{ uri: selectedGame.cover_url }} style={styles.detailBlurImage} blurRadius={3} />
                  <View style={styles.detailHeaderDim} />
                  <View style={styles.detailHeaderContent}>
                    <Image source={{ uri: selectedGame.cover_url }} style={styles.detailMainCover} />
                    <View style={styles.detailTitleBox}>
                      <Text style={styles.detailTitle} numberOfLines={2}>{selectedGame.title}</Text>
                      <View style={styles.detailPlatformRow}>
                        <MaterialCommunityIcons name="gamepad-variant-outline" size={13} color={C.primary} />
                        <Text style={styles.detailDev}>
                          {selectedGame.platform} · {selectedGame.developer || "Studio inconnu"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setDetailModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={20} color={C.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSubTabs}>
                  {(['manage', 'info'] as const).map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.subTab, detailTab === tab && styles.activeSubTab]}
                      onPress={() => setDetailTab(tab)}
                    >
                      <MaterialCommunityIcons
                        name={tab === 'manage' ? 'tune-variant' : 'information-outline'}
                        size={15}
                        color={detailTab === tab ? C.primary : C.textSecondary}
                      />
                      <Text style={[styles.subTabText, detailTab === tab && styles.activeSubTabText]}>
                        {tab === 'manage' ? 'GÉRER' : 'INFOS'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                  {detailTab === 'manage' ? (
                    <View style={styles.manageContainer}>
                      <Text style={styles.sectionTitle}>Action de la Wishlist</Text>
                      <TouchableOpacity style={styles.moveToCollectionBtn} onPress={moveToCollection}>
                        <MaterialCommunityIcons name="library-plus" size={20} color={C.primary} />
                        <Text style={styles.moveToCollectionBtnText}>Déplacer vers la collection</Text>
                      </TouchableOpacity>

                      <Text style={styles.sectionTitle}>Format souhaité</Text>
                      <View style={styles.formatToggle}>
                        {(['Physique', 'Numérique'] as const).map((f) => (
                          <TouchableOpacity
                            key={f}
                            style={[styles.formatBtn, selectedGame.displayFormat === f && styles.activeFormatBtn]}
                            onPress={() => updateGameField('format', f)}
                          >
                            <MaterialCommunityIcons
                              name={f === 'Physique' ? 'disc' : 'cloud-download-outline'}
                              size={14}
                              color={selectedGame.displayFormat === f ? C.bg : C.textSecondary}
                            />
                            <Text style={[styles.formatBtnText, selectedGame.displayFormat === f && styles.activeFormatBtnText]}>
                              {f}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.sectionTitle}>Plateforme</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                      {[...(selectedGame.platforms_list || [])]
                        .sort((a, b) => (a === selectedGame.platform ? -1 : b === selectedGame.platform ? 1 : 0))
                        .map((p: string) => (
                          <TouchableOpacity
                            key={p}
                            style={[styles.pill, selectedGame.platform === p && styles.activePill]}
                            onPress={() => updateGameField('platform', p)}
                          >
                            <Text style={[styles.pillText, selectedGame.platform === p && styles.activePillText]}>
                              {p}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <TouchableOpacity style={styles.deleteBtn} onPress={deleteGame}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={C.red} />
                        <Text style={styles.deleteBtnText}>Retirer de la wishlist</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.infoContainer}>
                      <Text style={styles.sectionTitle}>Description</Text>
                      <Text style={styles.descriptionText}>
                        {selectedGame.description || "Aucune description disponible."}
                      </Text>
                      <Text style={styles.sectionTitle}>Détails techniques</Text>
                      <View style={styles.techGrid}>
                        <DetailRow label="Date de sortie" value={selectedGame.release_date ? formatDate(selectedGame.release_date) : null} highlight />
                        <DetailRow label="Note IGDB" value={selectedGame.rating_igdb ? `${Math.round(selectedGame.rating_igdb)}%` : null} />
                        <DetailRow label="Éditeur" value={selectedGame.publisher} />
                        <DetailRow label="Développeur" value={selectedGame.developer} />
                        <DetailRow label="Moteur" value={selectedGame.engine} />
                        <DetailRow label="Modes de jeu" value={selectedGame.game_modes?.join(', ')} />
                        <DetailRow label="Genres" value={selectedGame.genres?.join(', ')} />
                      </View>

                      {selectedGame.screenshots?.length > 0 && (
                        <>
                          <Text style={styles.sectionTitle}>Captures d'écran</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.screenshotScroll}>
                            {selectedGame.screenshots.map((url: string, index: number) => (
                              <TouchableOpacity
                                key={index}
                                activeOpacity={0.85}
                                onPress={() => { setViewerImage(url); setViewerVisible(true); }}
                              >
                                <Image source={{ uri: url }} style={styles.screenshotImg} />
                              </TouchableOpacity>
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

      <Modal visible={sortModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSortModalVisible(false)} activeOpacity={1}>
          <View style={styles.sortModalContent}>
            <View style={styles.sortModalHandle} />
            <Text style={styles.modalTitle}>Trier par</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.sortOption, sortBy === option.id && styles.activeSortOption]}
                onPress={() => { setSortBy(option.id as any); setSortModalVisible(false); }}
              >
                <View style={[styles.sortIconWrap, sortBy === option.id && styles.sortIconWrapActive]}>
                  <MaterialCommunityIcons name={option.icon as any} size={18} color={sortBy === option.id ? C.bg : C.textSecondary} />
                </View>
                <Text style={[styles.sortOptionText, sortBy === option.id && styles.activeSortOptionText]}>
                  {option.label}
                </Text>
                {sortBy === option.id && (
                  <MaterialCommunityIcons name="check" size={16} color={C.primary} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalSearchContainer}>
          <View style={styles.modalSearchContent}>
            <View style={styles.searchModalHandle} />
            <View style={styles.searchHeader}>
              <View style={styles.searchInputWrapper}>
                <MaterialCommunityIcons name="magnify" size={18} color={C.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher sur IGDB..."
                  placeholderTextColor={C.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  autoFocus
                />
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeSearchBtn}>
                <Text style={styles.closeText}>Fermer</Text>
              </TouchableOpacity>
            </View>
            {searching ? (
              <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.uniqueSearchId}
                renderItem={({ item }) => {
                  const isAlreadyAdded = myGames.some(
                    (g) => g.game_id === item.id && g.platform === item.selectedPlatform
                  );

                  return (
                    <TouchableOpacity 
                      style={[styles.searchItem, isAlreadyAdded && styles.searchItemDisabled]} 
                      onPress={() => !isAlreadyAdded && handleAddGame(item)}
                      disabled={isAlreadyAdded}
                    >
                      <Image
                        source={item.cover?.url ? { uri: `https:${item.cover.url}` } : require('../../assets/images/icon.png')}
                        style={[styles.searchThumbnail, isAlreadyAdded && { opacity: 0.6 }]}
                      />
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={[styles.searchTitle, isAlreadyAdded && { color: C.textMuted }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.searchPlatform, isAlreadyAdded && { color: C.textMuted }]}>
                          {item.selectedPlatform}
                        </Text>
                      </View>
                      
                      <View style={[styles.addBtn, isAlreadyAdded && { backgroundColor: C.surfaceHigh, borderColor: C.border, borderWidth: 1 }]}>
                        <MaterialCommunityIcons 
                          name={isAlreadyAdded ? "check" : "plus"} 
                          size={18} 
                          color={isAlreadyAdded ? C.textMuted : C.bg} 
                        />
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={viewerVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            style={styles.viewerCloseBtn}
            onPress={() => setViewerVisible(false)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="close" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {selectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity style={styles.selectionCancelBtn} onPress={exitSelectionMode}>
            <MaterialCommunityIcons name="close" size={18} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.selectionBarText}>
            <Text style={{ color: C.primary, fontWeight: '700' }}>{selectedIds.size}</Text>
            {' '}sélectionné{selectedIds.size > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            style={[styles.selectionDeleteBtn, selectedIds.size === 0 && { opacity: 0.4 }]}
            onPress={deleteSelectedGames}
            disabled={selectedIds.size === 0}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#fff" />
            <Text style={styles.selectionDeleteBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectionMode && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={28} color={C.bg} />
        </TouchableOpacity>
      )}

    </View>
  );
}

// ─── Helpers plateforme ──────────────────────────────────────────────────────
const getPlatformInfo = (platform: string): { icon: string; bg: string; label: string } => {
  const p = platform?.toLowerCase() || '';
  if (p.includes('playstation') || p.includes('ps5') || p.includes('ps4') || p.includes('ps3') || p.includes('ps2') || p.includes('ps1') || p.includes('psp') || p.includes('ps vita'))
    return { icon: 'sony-playstation', bg: '#003791', label: platform };
  if (p.includes('nintendo switch') || p.includes('switch'))
    return { icon: 'nintendo-switch', bg: '#E4000F', label: 'Switch' };
  if (p.includes('xbox'))
    return { icon: 'microsoft-xbox', bg: '#107C10', label: platform };
  if (p.includes('pc') || p.includes('windows') || p.includes('microsoft windows'))
    return { icon: 'microsoft-windows', bg: '#555E68', label: 'PC' };
  if (p.includes('mac') || p.includes('macos'))
    return { icon: 'apple', bg: '#444444', label: 'Mac' };
  if (p.includes('ios') || p.includes('iphone') || p.includes('ipad'))
    return { icon: 'apple', bg: '#555555', label: 'iOS' };
  if (p.includes('android'))
    return { icon: 'android', bg: '#32DE84', label: 'Android' };
  if (p.includes('wii u'))
    return { icon: 'nintendo-wiiu', bg: '#009AC7', label: 'Wii U' };
  if (p.includes('wii'))
    return { icon: 'nintendo-wii', bg: '#009AC7', label: 'Wii' };
  if (p.includes('3ds') || p.includes('ds'))
    return { icon: 'nintendo-game-boy', bg: '#b0b0b0', label: platform };
  if (p.includes('game boy') || p.includes('gameboy'))
    return { icon: 'nintendo-game-boy', bg: '#7c448f', label: 'Game Boy' };
  if (p.includes('stadia'))
    return { icon: 'microsoft-xbox-controller', bg: '#FC4A1F', label: 'Stadia' };
  if (p.includes('steam'))
    return { icon: 'steam', bg: '#1B2838', label: 'Steam' };
  return { icon: 'gamepad-variant-outline', bg: C.textMuted, label: platform };
};

// ─── Composant PlatformBadge ─────────────────────────────────────────────────
const PlatformBadge = ({ platform }: { platform: string }) => {
  const { icon, bg, label } = getPlatformInfo(platform);
  return (
    <View style={[badgeStyles.platformBadge, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon as any} size={10} color="#fff" />
      <Text style={badgeStyles.platformBadgeText} numberOfLines={1}>{label}</Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 110,
  },
  platformBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

// ─── Composant DetailRow ─────────────────────────────────────────────────────
const DetailRow = ({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) => {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && { color: C.primary, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // LAYOUT
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 20,
  },

  // HEADER
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 22,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '400',
    color: C.textPrimary,
    letterSpacing: 0.5,
  },
  titleHighlight: {
    color: C.primary,
    fontWeight: '600',
  },
  count: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    marginLeft: 1,
  },
  countNum: {
    color: C.primary,
    fontWeight: '600',
  },
  
  // TABS
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 11,
    gap: 7,
  },
  activeTab: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  tabText: {
    color: C.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  activeTabText: {
    color: C.bg,
  },

  // SEARCH BAR
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  collectionSearchContainer: {
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: C.border,
  },
  collectionSearchInput: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 14,
    marginLeft: 10,
  },
  sortButton: {
    backgroundColor: C.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    height: 44,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // GRID
  listContent: { paddingBottom: 110 },
  row: { justifyContent: 'space-between' },

  // CARD
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: C.surface,
    borderRadius: 16,
    marginBottom: 18,
    overflow: 'hidden',
  },
  cardImageWrapper: {
    position: 'relative',
  },
  cardCover: {
    width: '100%',
    height: COLUMN_WIDTH * 1.4,
  },
  cardImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  cardInfo: {
    padding: 11,
    paddingTop: 9,
  },
  cardTitle: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  statusBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    color: C.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: C.textMuted,
    fontSize: 13,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: C.primary,
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },

  // DETAIL MODAL
  detailModalOverlay: {
    flex: 1,
    backgroundColor: C.bg,
  },
  detailModalContent: { flex: 1 },
  detailHeader: {
    height: height * 0.34,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  detailBlurImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.45,
  },
  detailHeaderDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(39,39,39,0.55)',
  },
  detailHeaderContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-end',
    gap: 16,
  },
  detailMainCover: {
    width: 105,
    height: 148,
    borderRadius: 12,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  detailTitleBox: { flex: 1, paddingBottom: 4 },
  detailTitle: {
    color: C.textPrimary,
    fontSize: 21,
    fontWeight: '600',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  detailPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  detailDev: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  closeDetailBtn: {
    position: 'absolute',
    top: 52,
    right: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },

  // DETAIL SUBTABS
  detailSubTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 7,
  },
  activeSubTab: {
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  subTabText: {
    color: C.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.2,
  },
  activeSubTabText: {
    color: C.primary,
  },
  detailScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 2,
  },

  // MANAGE TAB
  manageContainer: { paddingBottom: 50 },
  moveToCollectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${C.primary}55`,
    backgroundColor: C.primaryDim,
    marginBottom: 20,
  },
  moveToCollectionBtnText: {
    color: C.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  formatToggle: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: C.border,
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    gap: 6,
  },
  activeFormatBtn: {
    backgroundColor: C.primary,
  },
  formatBtnText: {
    color: C.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  activeFormatBtnText: {
    color: C.bg,
  },
  pillScroll: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  pill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
    backgroundColor: C.surface,
  },
  activePill: {
    borderColor: C.primary,
    backgroundColor: C.primaryDim,
  },
  pillText: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activePillText: {
    color: C.primary,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${C.red}44`,
    backgroundColor: C.redDim,
    marginTop: 10,
  },
  deleteBtnText: {
    color: C.red,
    fontWeight: '700',
    fontSize: 14,
  },

  // LIST VIEW
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    marginBottom: 10,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  listItemSelected: {
    borderColor: C.primary,
    backgroundColor: C.primaryDim,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  listCoverWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
  },
  listCover: {
    width: 44,
    height: 60,
    borderRadius: 8,
    backgroundColor: C.surfaceHigh,
  },
  listInfo: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  listTitle: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  listBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  listStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
    maxWidth: 110,
  },
  listStatusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  listCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.border,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // CARD SELECTION
  cardSelected: {
    borderWidth: 2,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,30,30,0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 9,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },

  // SELECTION ACTION BAR
  selectionBar: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceHigh,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 14,
    gap: 10,
  },
  selectionCancelBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  selectionBarText: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectionDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.red,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  selectionDeleteBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // INFO TAB
  infoContainer: { paddingBottom: 50 },
  descriptionText: {
    color: '#BBBBBB',
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 28,
  },
  techGrid: {
    backgroundColor: C.surface,
    padding: 18,
    borderRadius: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailLabel: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 20,
  },
  screenshotScroll: { marginTop: 4, marginBottom: 20 },
  screenshotImg: {
    width: 290,
    height: 163,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: C.surface,
  },

  // IMAGE VIEWER
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: width,
    height: height * 0.75,
  },
  viewerCloseBtn: {
    position: 'absolute',
    top: 52,
    right: 18,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },

  // SORT MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: C.surface,
    width: '82%',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  sortModalHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 12,
    marginBottom: 7,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeSortOption: {
    backgroundColor: C.primaryDim,
    borderColor: `${C.primary}44`,
  },
  sortIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIconWrapActive: {
    backgroundColor: C.primary,
  },
  sortOptionText: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeSortOptionText: {
    color: C.primary,
    fontWeight: '700',
  },

  // SEARCH MODAL
  modalSearchContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'flex-end',
  },
  modalSearchContent: {
    backgroundColor: C.surface,
    height: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  searchModalHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 14,
  },
  closeSearchBtn: {
    paddingHorizontal: 4,
  },
  closeText: {
    color: C.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  searchItem: {
    flexDirection: 'row',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: 'center',
  },
  searchThumbnail: {
    width: 48,
    height: 66,
    borderRadius: 9,
    backgroundColor: C.bg,
  },
  searchTitle: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  searchPlatform: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchItemDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  addBtn: {
    backgroundColor: C.primary,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});