// app/(tabs)/wishlist.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal,
  RefreshControl, ScrollView,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';

// Imports API centralisés
import {
  addGameToCollection,
  getCurrentUser,
  getUserCollection,
  getUserProfile,
  MAP_FORMAT_TO_SQL, MAP_SQL_TO_FORMAT,
  removeGameFromCollection, updateCollectionEntry
} from '@/api/collection';
import { searchGames } from '@/api/igdb';

// Imports Styles et UI centralisés
import { badgeStyles, C, styles as defaultStyles, getPlatformInfo } from './index.styles';
import { wishlistStyles } from './wishlist.styles';

// ─── Options de tri Spécifiques à la Wishlist ──────────────────────────────
const WISHLIST_SORT_OPTIONS = [
  { id: 'recent', label: 'Ajouts récents', icon: 'clock-outline' },
  { id: 'title', label: 'Nom (A-Z)', icon: 'sort-alphabetical-variant' },
  { id: 'release', label: 'Date de sortie', icon: 'calendar-clock' },
  { id: 'priority', label: 'Priorité d\'achat', icon: 'priority-high' },
];

const PRIORITIES = ['Basse', 'Moyenne', 'Haute', 'Immédiate'];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Immédiate': return C.red || '#FF4C4C';
    case 'Haute': return '#FF9800';
    case 'Moyenne': return C.blue || '#2196F3';
    case 'Basse': return C.textMuted;
    default: return C.textMuted;
  }
};

// Helpers Date et Compte à rebours
const getCountdown = (dateString: string) => {
  if (!dateString) return null;
  const releaseDate = new Date(dateString);
  const today = new Date();
  
  // On ignore l'heure pour comparer juste les jours
  releaseDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = releaseDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `Sort dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  if (diffDays === 0) return "Sort aujourd'hui !";
  return null;
};

// ─── Composants UI Locaux ────────────────────────────────────────────────────
const PlatformBadge = ({ platform }: { platform: string }) => {
  const { icon, bg, label } = getPlatformInfo(platform);
  return (
    <View style={[badgeStyles.platformBadge, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon as any} size={10} color="#fff" />
      <Text style={badgeStyles.platformBadgeText} numberOfLines={1}>{label}</Text>
    </View>
  );
};

const DetailRow = ({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) => {
  if (!value) return null;
  return (
    <View style={defaultStyles.detailRow}>
      <Text style={defaultStyles.detailLabel}>{label}</Text>
      <Text style={[defaultStyles.detailValue, highlight && { color: C.primary, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
};

export default function WishlistScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [myWishlist, setMyWishlist] = useState<any[]>([]); 
  const [fullCollection, setFullCollection] = useState<any[]>([]); 

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeFormat, setActiveFormat] = useState<'Physique' | 'Numérique'>('Physique');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'release' | 'priority'>('recent');
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
      const user = await getCurrentUser();
      if (!user) return;

      const collectionData = await getUserCollection(user.id);
      setFullCollection(collectionData);

      // FILTRE : On ne garde QUE la wishlist
      const wishlistData = collectionData.filter(item => item.status === 'wishlist');

      const formattedWishlist = wishlistData.map(item => ({
        ...item,
        title: item.game?.title || 'Titre inconnu',
        cover_url: item.game?.cover_url,
        genres: item.game?.genres,
        rating_igdb: item.game?.rating_igdb,
        platforms_list: item.game?.platforms_list,
        release_date: item.game?.release_date,
        developer: item.game?.developer,
        publisher: item.game?.publisher,
        game_modes: item.game?.game_modes,
        engine: item.game?.engine,
        description: item.game?.description,
        screenshots: item.game?.screenshots,
        displayFormat: MAP_SQL_TO_FORMAT[item.format as keyof typeof MAP_SQL_TO_FORMAT],
        priority: item.priority || 'Moyenne' // Valeur par défaut
      }));

      setMyWishlist(formattedWishlist);

      const profileData = await getUserProfile(user.id);
      if (profileData) setUsername(profileData.username);

    } catch (e: any) {
      console.error("Erreur récupération wishlist:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getProcessedGames = () => {
    let filtered = myWishlist.filter(game =>
      game.displayFormat === activeFormat &&
      game.title.toLowerCase().includes(collectionSearchQuery.toLowerCase())
    );
    switch (sortBy) {
      case 'title': return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'release': return filtered.sort((a, b) => {
        if (!a.release_date) return 1;
        if (!b.release_date) return -1;
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
      });
      case 'priority': 
        const val: Record<string, number> = { 'Immédiate': 4, 'Haute': 3, 'Moyenne': 2, 'Basse': 1 };
        return filtered.sort((a, b) => val[b.priority] - val[a.priority]);
      default: return filtered.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
    }
  };

  const updateGameField = async (field: 'format' | 'platform' | 'priority', value: any) => {
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

      setMyWishlist(myWishlist.map(g => g.id === selectedGame.id ? {
        ...g,
        [field]: sqlValue,
        ...(field === 'format' ? { displayFormat: displayValue } : {})
      } : g));

    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  const moveToCollection = async () => {
    try {
      // Déplace le jeu de la wishlist vers la collection (Statut "À faire")
      await updateCollectionEntry(selectedGame.id, { status: 'todo' });
      setDetailModalVisible(false);
      Alert.alert("Succès", "Jeu ajouté à votre collection !");
      fetchGames();
    } catch (e: any) {
      Alert.alert("Erreur", "Impossible de déplacer le jeu.");
    }
  };

  const deleteGame = () => {
    Alert.alert(
      "Retirer de la wishlist ?",
      "Voulez-vous vraiment retirer ce titre de vos envies ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer", style: "destructive",
          onPress: async () => {
            await removeGameFromCollection(selectedGame.id);
            setDetailModalVisible(false);
            fetchGames();
          }
        }
      ]
    );
  };

  //... Les fonctions de sélection multiple (toggleSelection, exitSelectionMode, deleteSelectedGames, handleSearch) restent identiques ...
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
      `Retirer ${count} jeu${count > 1 ? 'x' : ''} ?`,
      `Voulez-vous vraiment retirer ${count > 1 ? 'ces titres' : 'ce titre'} de la wishlist ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer", style: "destructive",
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
      const user = await getCurrentUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      // Vérifie si le jeu existe déjà dans la base
      const existingEntry = fullCollection.find(
        (g) => g.game_id === gameData.id && g.platform === gameData.selectedPlatform
      );

      if (existingEntry) {
         if (existingEntry.status !== 'wishlist') {
            alert("Ce jeu est déjà dans votre collection !");
            return;
         }
         alert("Ce jeu est déjà dans votre wishlist.");
         return;
      }

      await addGameToCollection({
        userId: user.id,
        gameData: gameData,
        preferences: {
          format: MAP_FORMAT_TO_SQL[activeFormat],
          status: 'wishlist', // Forcé à wishlist ici !
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
    <View style={defaultStyles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <FlatList
        data={processedGames}
        key={viewMode}
        numColumns={viewMode === 'grid' ? 2 : 1}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={viewMode === 'grid' ? defaultStyles.row : undefined}
        contentContainerStyle={defaultStyles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchGames} tintColor={C.primary} />}

        ListHeaderComponent={
          <View>
            <View style={defaultStyles.headerRow}>
              <View>
                <View style={defaultStyles.headerTitleRow}>
                  <Text style={defaultStyles.title}>
                    {username ? (<>Wishlist de <Text style={defaultStyles.usernameHighlight}>{username}</Text></>) : ('Ma Wishlist')}
                  </Text>
                </View>
                <Text style={defaultStyles.count}>
                  <Text style={defaultStyles.countNum}>{processedGames.length}</Text>
                  {' '}jeux convoités ({activeFormat.toLowerCase()}s)
                </Text>
              </View>
            </View>

            <View style={defaultStyles.tabsContainer}>
              {(['Physique', 'Numérique'] as const).map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[defaultStyles.tab, activeFormat === format && defaultStyles.activeTab]}
                  onPress={() => { setActiveFormat(format); setCollectionSearchQuery(''); }}
                >
                  <MaterialCommunityIcons
                    name={format === 'Physique' ? 'disc' : 'cloud-download-outline'}
                    size={17}
                    color={activeFormat === format ? C.bg : C.textSecondary}
                  />
                  <Text style={[defaultStyles.tabText, activeFormat === format && defaultStyles.activeTabText]}>
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={defaultStyles.searchRow}>
              <View style={defaultStyles.collectionSearchContainer}>
                <MaterialCommunityIcons name="magnify" size={18} color={C.textSecondary} />
                <TextInput
                  style={defaultStyles.collectionSearchInput}
                  placeholder="Rechercher dans la wishlist..."
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

              <TouchableOpacity style={defaultStyles.sortButton} onPress={() => setSortModalVisible(true)}>
                <MaterialCommunityIcons name="sort-variant" size={22} color={C.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={defaultStyles.sortButton}
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
          const countdown = getCountdown(item.release_date);
          const pColor = getPriorityColor(item.priority);

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
              <TouchableOpacity style={[defaultStyles.listItem, isSelected && defaultStyles.listItemSelected]} {...pressHandlers}>
                {selectionMode && (
                  <View style={[defaultStyles.listCheckCircle, isSelected && defaultStyles.checkCircleActive]}>
                    {isSelected && <MaterialCommunityIcons name="check" size={14} color={C.bg} />}
                  </View>
                )}
                <View style={defaultStyles.listCoverWrapper}>
                  <Image source={{ uri: item.cover_url }} style={defaultStyles.listCover} resizeMode="cover" />
                </View>
                <View style={defaultStyles.listInfo}>
                  <Text style={defaultStyles.listTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={defaultStyles.listBadgesRow}>
                    <PlatformBadge platform={item.platform} />
                    {/* Badge de priorité au lieu de IGDB */}
                    <View style={[wishlistStyles.priorityMiniBadge, { borderColor: pColor }]}>
                      <View style={[wishlistStyles.priorityDot, { backgroundColor: pColor }]} />
                      <Text style={[wishlistStyles.priorityMiniText, { color: pColor }]}>{item.priority}</Text>
                    </View>
                  </View>
                  {countdown && (
                    <Text style={wishlistStyles.countdownText}>
                       <MaterialCommunityIcons name="clock-fast" size={10} /> {countdown}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity style={[defaultStyles.card, isSelected && defaultStyles.cardSelected]} {...pressHandlers}>
              <View style={defaultStyles.cardImageWrapper}>
                <Image source={{ uri: item.cover_url }} style={defaultStyles.cardCover} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(39,39,39,0.55)', 'rgba(39,39,39,0.92)']} style={defaultStyles.cardImageOverlay} />
                
                {/* Badge Compte à rebours */}
                {countdown && !selectionMode && (
                  <View style={wishlistStyles.cardCountdownBadge}>
                    <MaterialCommunityIcons name="clock-fast" size={11} color="#fff" />
                    <Text style={wishlistStyles.cardCountdownText}>{countdown}</Text>
                  </View>
                )}

                {selectionMode && (
                  <View style={defaultStyles.selectionOverlay}>
                    <View style={[defaultStyles.checkCircle, isSelected && defaultStyles.checkCircleActive]}>
                      {isSelected && <MaterialCommunityIcons name="check" size={16} color={C.bg} />}
                    </View>
                  </View>
                )}
              </View>
              
              <View style={defaultStyles.cardInfo}>
                <Text style={defaultStyles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={defaultStyles.cardBadgesRow}>
                  <PlatformBadge platform={item.platform} />
                  <View style={[wishlistStyles.priorityMiniBadge, { borderColor: pColor }]}>
                      <View style={[wishlistStyles.priorityDot, { backgroundColor: pColor }]} />
                      <Text style={[wishlistStyles.priorityMiniText, { color: pColor }]}>{item.priority}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={defaultStyles.emptyState}>
              <MaterialCommunityIcons name="playlist-star" size={48} color={C.textMuted} />
              <Text style={defaultStyles.emptyTitle}>Wishlist vide</Text>
              <Text style={defaultStyles.emptySubtitle}>Appuyez sur + pour ajouter un jeu convoité</Text>
            </View>
          ) : null
        }
      />

      {/* --- MODALE DE DÉTAIL --- */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={defaultStyles.detailModalOverlay}>
          <View style={defaultStyles.detailModalContent}>
            {selectedGame && (
              <>
                <View style={defaultStyles.detailHeader}>
                  <Image source={{ uri: selectedGame.cover_url }} style={defaultStyles.detailBlurImage} blurRadius={3} />
                  <View style={defaultStyles.detailHeaderDim} />
                  <View style={defaultStyles.detailHeaderContent}>
                    <Image source={{ uri: selectedGame.cover_url }} style={defaultStyles.detailMainCover} />
                    <View style={defaultStyles.detailTitleBox}>
                      <Text style={defaultStyles.detailTitle} numberOfLines={2}>{selectedGame.title}</Text>
                      <View style={defaultStyles.detailPlatformRow}>
                        <MaterialCommunityIcons name="gamepad-variant-outline" size={13} color={C.primary} />
                        <Text style={defaultStyles.detailDev}>
                          {selectedGame.platform} · {selectedGame.developer || "Studio inconnu"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={defaultStyles.closeDetailBtn} onPress={() => setDetailModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={20} color={C.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={defaultStyles.detailSubTabs}>
                  {(['manage', 'info'] as const).map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[defaultStyles.subTab, detailTab === tab && defaultStyles.activeSubTab]}
                      onPress={() => setDetailTab(tab)}
                    >
                      <MaterialCommunityIcons
                        name={tab === 'manage' ? 'tune-variant' : 'information-outline'}
                        size={15}
                        color={detailTab === tab ? C.primary : C.textSecondary}
                      />
                      <Text style={[defaultStyles.subTabText, detailTab === tab && defaultStyles.activeSubTabText]}>
                        {tab === 'manage' ? 'GÉRER' : 'INFOS'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <ScrollView style={defaultStyles.detailScroll} showsVerticalScrollIndicator={false}>
                  {detailTab === 'manage' ? (
                    <View style={defaultStyles.manageContainer}>
                      
                      <Text style={defaultStyles.sectionTitle}>Priorité d'achat</Text>
                      <View style={defaultStyles.statusGrid}>
                        {PRIORITIES.map((p) => {
                          const pColor = getPriorityColor(p);
                          const isActive = selectedGame.priority === p;
                          return (
                            <TouchableOpacity
                              key={p}
                              style={[
                                defaultStyles.statusOption,
                                { borderColor: isActive ? pColor : C.border },
                                isActive && { backgroundColor: `${pColor}18` }
                              ]}
                              onPress={() => updateGameField('priority', p)}
                            >
                              <MaterialCommunityIcons name={isActive ? "star" : "star-outline"} size={14} color={isActive ? pColor : C.textSecondary} />
                              <Text style={[defaultStyles.statusOptionText, isActive && { color: pColor }]}>{p}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={defaultStyles.sectionTitle}>Format visé</Text>
                      <View style={defaultStyles.formatToggle}>
                        {(['Physique', 'Numérique'] as const).map((f) => (
                          <TouchableOpacity
                            key={f}
                            style={[defaultStyles.formatBtn, selectedGame.displayFormat === f && defaultStyles.activeFormatBtn]}
                            onPress={() => updateGameField('format', f)}
                          >
                            <MaterialCommunityIcons
                              name={f === 'Physique' ? 'disc' : 'cloud-download-outline'}
                              size={14}
                              color={selectedGame.displayFormat === f ? C.bg : C.textSecondary}
                            />
                            <Text style={[defaultStyles.formatBtnText, selectedGame.displayFormat === f && defaultStyles.activeFormatBtnText]}>
                              {f}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={defaultStyles.sectionTitle}>Plateforme</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={defaultStyles.pillScroll}>
                        {[...(selectedGame.platforms_list || [])]
                          .sort((a, b) => (a === selectedGame.platform ? -1 : b === selectedGame.platform ? 1 : 0))
                          .map((p: string) => (
                            <TouchableOpacity
                              key={p}
                              style={[defaultStyles.pill, selectedGame.platform === p && defaultStyles.activePill]}
                              onPress={() => updateGameField('platform', p)}
                            >
                              <Text style={[defaultStyles.pillText, selectedGame.platform === p && defaultStyles.activePillText]}>
                                {p}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>

                      {/* Bouton de transfert vers Collection */}
                      <TouchableOpacity style={wishlistStyles.transferBtn} onPress={moveToCollection}>
                        <MaterialCommunityIcons name="library-plus" size={18} color={C.bg} />
                        <Text style={wishlistStyles.transferBtnText}>J'ai acheté ce jeu (Ajouter à la collection)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={defaultStyles.deleteBtn} onPress={deleteGame}>
                        <MaterialCommunityIcons name="playlist-remove" size={18} color={C.red} />
                        <Text style={defaultStyles.deleteBtnText}>Retirer de la Wishlist</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={defaultStyles.infoContainer}>
                      <Text style={defaultStyles.sectionTitle}>Description</Text>
                      <Text style={defaultStyles.descriptionText}>
                        {selectedGame.description || "Aucune description disponible."}
                      </Text>
                      <Text style={defaultStyles.sectionTitle}>Détails techniques</Text>
                      <View style={defaultStyles.techGrid}>
                        <DetailRow label="Date de sortie" value={selectedGame.release_date ? formatDate(selectedGame.release_date) : null} highlight={!!getCountdown(selectedGame.release_date)} />
                        <DetailRow label="Éditeur" value={selectedGame.publisher} />
                        <DetailRow label="Développeur" value={selectedGame.developer} />
                        <DetailRow label="Moteur" value={selectedGame.engine} />
                        <DetailRow label="Modes de jeu" value={selectedGame.game_modes?.join(', ')} />
                        <DetailRow label="Genres" value={selectedGame.genres?.join(', ')} />
                      </View>

                      {selectedGame.screenshots?.length > 0 && (
                        <>
                          <Text style={defaultStyles.sectionTitle}>Captures d'écran</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={defaultStyles.screenshotScroll}>
                            {selectedGame.screenshots.map((url: string, index: number) => (
                              <TouchableOpacity key={index} activeOpacity={0.85} onPress={() => { setViewerImage(url); setViewerVisible(true); }}>
                                <Image source={{ uri: url }} style={defaultStyles.screenshotImg} />
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

      {/* --- MODALE DE TRI --- */}
      <Modal visible={sortModalVisible} transparent animationType="fade">
        <TouchableOpacity style={defaultStyles.modalOverlay} onPress={() => setSortModalVisible(false)} activeOpacity={1}>
          <View style={defaultStyles.sortModalContent}>
            <View style={defaultStyles.sortModalHandle} />
            <Text style={defaultStyles.modalTitle}>Trier la wishlist par</Text>
            {WISHLIST_SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[defaultStyles.sortOption, sortBy === option.id && defaultStyles.activeSortOption]}
                onPress={() => { setSortBy(option.id as any); setSortModalVisible(false); }}
              >
                <View style={[defaultStyles.sortIconWrap, sortBy === option.id && defaultStyles.sortIconWrapActive]}>
                  <MaterialCommunityIcons name={option.icon as any} size={18} color={sortBy === option.id ? C.bg : C.textSecondary} />
                </View>
                <Text style={[defaultStyles.sortOptionText, sortBy === option.id && defaultStyles.activeSortOptionText]}>
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

      {/* --- MODALE DE RECHERCHE / AJOUT --- */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={defaultStyles.modalSearchContainer}>
          <View style={defaultStyles.modalSearchContent}>
            <View style={defaultStyles.searchModalHandle} />
            <View style={defaultStyles.searchHeader}>
              <View style={defaultStyles.searchInputWrapper}>
                <MaterialCommunityIcons name="magnify" size={18} color={C.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={defaultStyles.searchInput}
                  placeholder="Rechercher un jeu à convoiter..."
                  placeholderTextColor={C.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  autoFocus
                />
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={defaultStyles.closeSearchBtn}>
                <Text style={defaultStyles.closeText}>Fermer</Text>
              </TouchableOpacity>
            </View>
            {searching ? (
              <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.uniqueSearchId}
                renderItem={({ item }) => {
                  const existingEntry = fullCollection.find(
                    (g) => g.game_id === item.id && g.platform === item.selectedPlatform
                  );

                  const isAlreadyInCollection = existingEntry && existingEntry.status !== 'wishlist';
                  const isAlreadyInWishlist = existingEntry && existingEntry.status === 'wishlist';

                  return (
                    <TouchableOpacity
                      style={[defaultStyles.searchItem, (isAlreadyInCollection || isAlreadyInWishlist) && defaultStyles.searchItemDisabled]}
                      onPress={() => !(isAlreadyInCollection || isAlreadyInWishlist) && handleAddGame(item)}
                      disabled={isAlreadyInCollection || isAlreadyInWishlist}
                    >
                      <Image
                        source={item.cover?.url ? { uri: `https:${item.cover.url}` } : require('../../assets/images/icon.png')}
                        style={[defaultStyles.searchThumbnail, (isAlreadyInCollection || isAlreadyInWishlist) && { opacity: 0.6 }]}
                      />
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={[defaultStyles.searchTitle, (isAlreadyInCollection || isAlreadyInWishlist) && { color: C.textMuted }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[defaultStyles.searchPlatform, (isAlreadyInCollection || isAlreadyInWishlist) && { color: C.textMuted }]}>
                          {item.selectedPlatform}
                        </Text>
                        {isAlreadyInCollection && (
                          <Text style={{ color: C.primary, fontSize: 10, marginTop: 2, fontWeight: '600' }}>
                            Déjà dans la collection
                          </Text>
                        )}
                        {isAlreadyInWishlist && (
                          <Text style={{ color: C.pink || '#ff66b2', fontSize: 10, marginTop: 2, fontWeight: '600' }}>
                            Déjà dans la wishlist
                          </Text>
                        )}
                      </View>

                      <View style={[
                        defaultStyles.addBtn,
                        (isAlreadyInCollection || isAlreadyInWishlist) && { backgroundColor: C.surfaceHigh, borderColor: C.border, borderWidth: 1 }
                      ]}>
                        <MaterialCommunityIcons
                          name={(isAlreadyInCollection || isAlreadyInWishlist) ? "check" : "heart-plus"}
                          size={18}
                          color={(isAlreadyInCollection || isAlreadyInWishlist) ? C.textMuted : C.bg}
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

      {/* --- AUTRES ÉLÉMENTS RESTANTS IDENTIQUES --- */}
      <Modal visible={viewerVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={defaultStyles.viewerOverlay}>
          <TouchableOpacity style={defaultStyles.viewerCloseBtn} onPress={() => setViewerVisible(false)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="close" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          {viewerImage && (
            <Image source={{ uri: viewerImage }} style={defaultStyles.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {selectionMode && (
        <View style={defaultStyles.selectionBar}>
          <TouchableOpacity style={defaultStyles.selectionCancelBtn} onPress={exitSelectionMode}>
            <MaterialCommunityIcons name="close" size={18} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={defaultStyles.selectionBarText}>
            <Text style={{ color: C.primary, fontWeight: '700' }}>{selectedIds.size}</Text>
            {' '}sélectionné{selectedIds.size > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            style={[defaultStyles.selectionDeleteBtn, selectedIds.size === 0 && { opacity: 0.4 }]}
            onPress={deleteSelectedGames}
            disabled={selectedIds.size === 0}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#fff" />
            <Text style={defaultStyles.selectionDeleteBtnText}>Retirer</Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectionMode && (
        <TouchableOpacity style={defaultStyles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <MaterialCommunityIcons name="heart-plus" size={28} color={C.bg} />
        </TouchableOpacity>
      )}

    </View>
  );
}