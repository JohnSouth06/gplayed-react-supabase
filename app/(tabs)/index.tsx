// app/(tabs)/index.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal,
  RefreshControl, ScrollView,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { useCustomTheme } from '../../context/ThemeContext';

import {
  addGameToCollection,
  getCurrentUser,
  getUserCollection,
  getUserProfile,
  MAP_FORMAT_TO_SQL, MAP_SQL_TO_FORMAT,
  MAP_SQL_TO_STATUS,
  MAP_STATUS_TO_SQL,
  removeGameFromCollection, updateCollectionEntry
} from '@/api/collection';
import { searchGames } from '@/api/igdb';

import { badgeStyles, getBaseStyles, getPlatformInfo, getRatingColor, SORT_OPTIONS } from '../../styles/index.styles';

const PlatformBadge = ({ platform }: { platform: string }) => {
  const { icon, bg, label } = getPlatformInfo(platform);
  return (
    <View style={[badgeStyles.platformBadge, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon as any} size={10} color="#fff" />
      <Text style={badgeStyles.platformBadgeText} numberOfLines={1}>{label}</Text>
    </View>
  );
};

const IgdbBadge = ({ rating }: { rating: number }) => {
  const score = Math.round(rating);
  const color = getRatingColor(score);
  return (
    <View style={[badgeStyles.igdbBadge, { borderColor: `${color}55`, backgroundColor: `${color}18` }]}>
      <MaterialCommunityIcons name="star" size={9} color={color} />
      <Text style={[badgeStyles.igdbBadgeText, { color }]}>{score}</Text>
    </View>
  );
};

const DetailRow = ({ label, value, highlight, styles, accentColor }: { label: string; value: any; highlight?: boolean; styles: any; accentColor: string }) => {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && { color: accentColor, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
};

export default function DashboardScreen() {
  const { theme: currentTheme } = useCustomTheme(); 
  const accentColor = currentTheme.primary;

  const styles = useMemo(() => 
    getBaseStyles(currentTheme, accentColor, currentTheme.primaryDim), 
  [currentTheme, accentColor]);
  // ───────────────────────────────────────────────────────────────────────────

  const [username, setUsername] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [myGames, setMyGames] = useState<any[]>([]);
  const [fullCollection, setFullCollection] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeFormat, setActiveFormat] = useState<'Physique' | 'Numérique'>('Physique');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'rating' | 'playtime'>('recent');
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

      const dashboardData = collectionData.filter(item => item.status !== 'wishlist');
      const formattedCollection = dashboardData.map(item => ({
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
        displayStatus: MAP_SQL_TO_STATUS[item.status as keyof typeof MAP_SQL_TO_STATUS]
      }));
      setMyGames(formattedCollection);
      const profileData = await getUserProfile(user.id);
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
      case 'rating': return filtered.sort((a, b) => (b.rating_igdb || 0) - (a.rating_igdb || 0));
      case 'playtime': return filtered.sort((a, b) => (b.playtime || 0) - (a.playtime || 0));
      default: return filtered.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
    }
  };

  const updateGameField = async (field: 'format' | 'status' | 'playtime' | 'platform', value: any) => {
    try {
      let sqlValue = value;
      if (field === 'format') sqlValue = MAP_FORMAT_TO_SQL[value as keyof typeof MAP_FORMAT_TO_SQL];
      if (field === 'status') sqlValue = MAP_STATUS_TO_SQL[value as keyof typeof MAP_STATUS_TO_SQL];
      await updateCollectionEntry(selectedGame.id, { [field]: sqlValue });
      const displayValue = value;
      setSelectedGame({
        ...selectedGame,
        [field]: sqlValue,
        ...(field === 'format' ? { displayFormat: displayValue } : {}),
        ...(field === 'status' ? { displayStatus: displayValue } : {})
      });
      setMyGames(myGames.map(g => g.id === selectedGame.id ? {
        ...g,
        [field]: sqlValue,
        ...(field === 'format' ? { displayFormat: displayValue } : {}),
        ...(field === 'status' ? { displayStatus: displayValue } : {})
      } : g));
    } catch (e: any) { Alert.alert("Erreur", e.message); }
  };

  const deleteGame = () => {
    Alert.alert("Supprimer ce jeu ?", "Voulez-vous vraiment retirer ce titre de votre collection ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => { await removeGameFromCollection(selectedGame.id); setDetailModalVisible(false); fetchGames(); } }
    ]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); if (next.size === 0) setSelectionMode(false); } 
      else { next.add(id); }
      return next;
    });
  };

  const exitSelectionMode = () => { setSelectionMode(false); setSelectedIds(new Set()); };

  const deleteSelectedGames = () => {
    const count = selectedIds.size;
    Alert.alert(`Supprimer ${count} jeu${count > 1 ? 'x' : ''} ?`, `Voulez-vous vraiment retirer ${count > 1 ? 'ces titres' : 'ce titre'} de votre collection ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
          try {
            const ids = Array.from(selectedIds);
            await Promise.all(ids.map(id => removeGameFromCollection(id)));
            exitSelectionMode();
            fetchGames();
          } catch (e: any) { Alert.alert("Erreur", e.message); }
        }
      }
    ]);
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
            game.platforms.forEach((p: any) => { flattened.push({ ...game, selectedPlatform: p.name, uniqueSearchId: `${game.id}-${p.id}` }); });
          } else { flattened.push({ ...game, selectedPlatform: 'PC', uniqueSearchId: game.id.toString() }); }
        });
        setResults(flattened);
      } else { setResults([]); }
    } catch (e) { setResults([]); } finally { setSearching(false); }
  };

  const handleAddGame = async (gameData: any) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Utilisateur non authentifié");
      const wishlistEntry = fullCollection.find((g) => g.game_id === gameData.id && g.platform === gameData.selectedPlatform && g.status === 'wishlist');
      if (wishlistEntry) {
        await updateCollectionEntry(wishlistEntry.id, { status: 'todo' });
      } else {
        await addGameToCollection({
          userId: user.id,
          gameData: gameData,
          preferences: { format: MAP_FORMAT_TO_SQL[activeFormat], status: 'todo', platform: gameData.selectedPlatform, priority: 'Moyenne' }
        });
      }
      setModalVisible(false); setSearchQuery(''); fetchGames();
    } catch (error: any) { alert(error.message); }
  };

const getStatusColor = (displayStatus: string) => {
    switch (displayStatus) {
      case 'En cours': 
        return accentColor;
      case 'Terminé': 
        return currentTheme.blue;
      case 'Platiné - 100%': 
        return currentTheme.yellow;
      case 'Abandonné': 
        return currentTheme.red;
      default: 
        return currentTheme.grey;
    }
  };

  const getStatusIcon = (displayStatus: string) => {
    switch (displayStatus) {
      case 'En cours': return 'play-circle';
      case 'Terminé': return 'check-circle';
      case 'Platiné - 100%': return 'trophy';
      case 'Abandonné': return 'close-circle';
      default: return 'circle-outline';
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
      <StatusBar style={currentTheme.bg === '#ffffff' ? "dark" : "light"} />
      <FlatList
        data={processedGames}
        key={viewMode}
        numColumns={viewMode === 'grid' ? 2 : 1}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchGames} tintColor={accentColor} />}

        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.title}>
                    {username ? (<>Bonjour <Text style={styles.usernameHighlight}>{username}</Text> </>) : ('Ma Collection')}
                  </Text>
                </View>
                <Text style={styles.count}>
                  <Text style={styles.countNum}>{processedGames.length}</Text>
                  {` ${processedGames.length > 1 ? 'jeux' : 'jeu'} ${activeFormat.toLowerCase()}${processedGames.length > 1 ? 's' : ''}`}
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
                    color={activeFormat === format ? currentTheme.bg : currentTheme.textSecondary}
                  />
                  <Text style={[styles.tabText, activeFormat === format && styles.activeTabText]}>
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.searchRow}>
              <View style={styles.collectionSearchContainer}>
                <MaterialCommunityIcons name="magnify" size={18} color={currentTheme.textSecondary} />
                <TextInput
                  style={styles.collectionSearchInput}
                  placeholder="Rechercher dans la collection..."
                  placeholderTextColor={currentTheme.textMuted}
                  value={collectionSearchQuery}
                  onChangeText={setCollectionSearchQuery}
                  clearButtonMode="while-editing"
                />
                {collectionSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setCollectionSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={currentTheme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
                <MaterialCommunityIcons name="sort-variant" size={22} color={accentColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => { exitSelectionMode(); setViewMode(v => v === 'grid' ? 'list' : 'grid'); }}
              >
                <MaterialCommunityIcons
                  name={viewMode === 'grid' ? 'view-list-outline' : 'view-grid-outline'}
                  size={22}
                  color={accentColor}
                />
              </TouchableOpacity>
            </View>
          </View>
        }

        renderItem={({ item }) => {
          const statusColor = getStatusColor(item.displayStatus);
          const itemId = item.id.toString();
          const isSelected = selectedIds.has(itemId);
          const pressHandlers = {
            onPress: () => { if (selectionMode) { toggleSelection(itemId); } else { setSelectedGame(item); setDetailModalVisible(true); setDetailTab('manage'); } },
            onLongPress: () => { if (!selectionMode) { setSelectionMode(true); setSelectedIds(new Set([itemId])); } },
            delayLongPress: 350,
            activeOpacity: 0.8 as number,
          };

          if (viewMode === 'list') {
            return (
              <TouchableOpacity style={[styles.listItem, isSelected && styles.listItemSelected]} {...pressHandlers}>
                {selectionMode && (
                  <View style={[styles.listCheckCircle, isSelected && styles.checkCircleActive]}>
                    {isSelected && <MaterialCommunityIcons name="check" size={14} color={currentTheme.bg} />}
                  </View>
                )}
                <View style={styles.listCoverWrapper}>
                  <Image source={{ uri: item.cover_url }} style={styles.listCover} resizeMode="cover" />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.listBadgesRow}>
                    <PlatformBadge platform={item.platform} />
                    {item.rating_igdb ? <IgdbBadge rating={item.rating_igdb} /> : null}
                  </View>
                </View>
                {!selectionMode && (
                  <View style={[styles.listStatusBadge, { backgroundColor: `${statusColor}22`, borderColor: `${statusColor}55` }]}>
                    <MaterialCommunityIcons name={getStatusIcon(item.displayStatus) as any} size={13} color={statusColor} />
                    <Text style={[styles.listStatusText, { color: statusColor }]} numberOfLines={1}>{item.displayStatus}</Text>
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
                      {isSelected && <MaterialCommunityIcons name="check" size={16} color={currentTheme.bg} />}
                    </View>
                  </View>
                )}
              </View>
              {!selectionMode && (
                <View style={[styles.statusBadge, { backgroundColor: `${currentTheme.bg}90`, color: `${statusColor}99`, borderColor: `${statusColor}90` }]}>
                  <MaterialCommunityIcons name={getStatusIcon(item.displayStatus) as any} size={12} color={statusColor} />
                  <Text style={[styles.statusText, { color: statusColor }]}>{item.displayStatus}</Text>
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardBadgesRow}>
                  <PlatformBadge platform={item.platform} />
                  {item.rating_igdb ? <IgdbBadge rating={item.rating_igdb} /> : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="controller-off" size={48} color={currentTheme.textMuted} />
              <Text style={styles.emptyTitle}>Aucun jeu ici</Text>
              <Text style={styles.emptySubtitle}>Appuyez sur + pour ajouter un titre</Text>
            </View>
          ) : null
        }
      />

{/* --- MODALE DE DÉTAIL --- */}
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
                        <MaterialCommunityIcons name="gamepad-variant-outline" size={13} color={accentColor} />
                        <Text style={styles.detailDev}>
                          {selectedGame.platform} · {selectedGame.developer || "Studio inconnu"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setDetailModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={20} color={currentTheme.textPrimary} />
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
                        color={detailTab === tab ? accentColor : currentTheme.textSecondary}
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
                      <Text style={styles.sectionTitle}>Format</Text>
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
                              color={selectedGame.displayFormat === f ? currentTheme.bg : currentTheme.textSecondary}
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

                      <Text style={styles.sectionTitle}>Statut</Text>
                      <View style={styles.statusGrid}>
                        {['A faire', 'En cours', 'Terminé', 'Platiné - 100%', 'Abandonné'].map((s) => {
                          const sColor = getStatusColor(s);
                          const isActive = selectedGame.displayStatus === s;
                          return (
                            <TouchableOpacity
                              key={s}
                              style={[
                                styles.statusOption,
                                { borderColor: isActive ? sColor : currentTheme.border },
                                isActive && { backgroundColor: `${sColor}18` }
                              ]}
                              onPress={() => updateGameField('status', s)}
                            >
                              <MaterialCommunityIcons name={getStatusIcon(s) as any} size={14} color={isActive ? sColor : currentTheme.textSecondary} />
                              <Text style={[styles.statusOptionText, isActive && { color: sColor }]}>{s}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={styles.sectionTitle}>Temps de jeu</Text>
                      <View style={styles.playtimeRow}>
                        <MaterialCommunityIcons name="timer-outline" size={22} color={accentColor} />
                        <TextInput
                          style={styles.playtimeInput}
                          keyboardType="numeric"
                          value={selectedGame.playtime?.toString()}
                          onChangeText={(v) => updateGameField('playtime', parseInt(v) || 0)}
                          placeholderTextColor={currentTheme.textMuted}
                        />
                        <Text style={styles.playtimeLabel}>min</Text>
                      </View>

                      <TouchableOpacity style={styles.deleteBtn} onPress={deleteGame}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={currentTheme.red} />
                        <Text style={styles.deleteBtnText}>Supprimer de la collection</Text>
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
                        <DetailRow label="Note IGDB" value={selectedGame.rating_igdb ? `${Math.round(selectedGame.rating_igdb)}%` : null} highlight styles={styles} accentColor={accentColor} />
                        <DetailRow label="Date de sortie" value={selectedGame.release_date ? formatDate(selectedGame.release_date) : null} styles={styles} accentColor={accentColor} />
                        <DetailRow label="Éditeur" value={selectedGame.publisher} styles={styles} accentColor={accentColor} />
                        <DetailRow label="Développeur" value={selectedGame.developer} styles={styles} accentColor={accentColor} />
                        <DetailRow label="Moteur" value={selectedGame.engine} styles={styles} accentColor={accentColor} />
                        <DetailRow label="Modes de jeu" value={selectedGame.game_modes?.join(', ')} styles={styles} accentColor={accentColor} />
                        <DetailRow label="Genres" value={selectedGame.genres?.join(', ')} styles={styles} accentColor={accentColor} />
                      </View>

                      {selectedGame.screenshots?.length > 0 && (
                        <>
                          <Text style={styles.sectionTitle}>Captures d'écran</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.screenshotScroll}>
                            {selectedGame.screenshots.map((url: string, index: number) => (
                              <TouchableOpacity key={index} activeOpacity={0.85} onPress={() => { setViewerImage(url); setViewerVisible(true); }}>
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
                  <MaterialCommunityIcons name={option.icon as any} size={18} color={sortBy === option.id ? currentTheme.bg : currentTheme.textSecondary} />
                </View>
                <Text style={[styles.sortOptionText, sortBy === option.id && styles.activeSortOptionText]}>
                  {option.label}
                </Text>
                {sortBy === option.id && (
                  <MaterialCommunityIcons name="check" size={16} color={accentColor} style={{ marginLeft: 'auto' }} />
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
                <MaterialCommunityIcons name="magnify" size={18} color={currentTheme.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher jeu..."
                  placeholderTextColor={currentTheme.textMuted}
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
              <ActivityIndicator color={accentColor} style={{ marginTop: 30 }} />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.uniqueSearchId}
                renderItem={({ item }) => {
                  const existingEntry = fullCollection.find((g) => g.game_id === item.id && g.platform === item.selectedPlatform);
                  const isAlreadyAdded = existingEntry && existingEntry.status !== 'wishlist';
                  const isInWishlist = existingEntry && existingEntry.status === 'wishlist';

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
                        <Text style={[styles.searchTitle, isAlreadyAdded && { color: currentTheme.textMuted }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.searchPlatform, isAlreadyAdded && { color: currentTheme.textMuted }]}>
                          {item.selectedPlatform}
                        </Text>
                        {isInWishlist && (
                          <Text style={{ color: currentTheme.pink, fontSize: 10, marginTop: 2, fontWeight: '600' }}>
                            Dans votre wishlist
                          </Text>
                        )}
                      </View>

                      <View style={[
                        styles.addBtn,
                        isAlreadyAdded && { backgroundColor: currentTheme.surfaceHigh, borderColor: currentTheme.border, borderWidth: 1 },
                        isInWishlist && { backgroundColor: currentTheme.pinkDim, borderColor: currentTheme.pink, borderWidth: 1 }
                      ]}>
                        <MaterialCommunityIcons
                          name={isAlreadyAdded ? "check" : isInWishlist ? "library-plus" : "plus"}
                          size={18}
                          color={isAlreadyAdded ? currentTheme.textMuted : isInWishlist ? currentTheme.pink : currentTheme.bg}
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
          <TouchableOpacity style={styles.viewerCloseBtn} onPress={() => setViewerVisible(false)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="close" size={22} color={currentTheme.textPrimary} />
          </TouchableOpacity>
          {viewerImage && (
            <Image source={{ uri: viewerImage }} style={styles.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {selectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity style={styles.selectionCancelBtn} onPress={exitSelectionMode}>
            <MaterialCommunityIcons name="close" size={18} color={currentTheme.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.selectionBarText}>
            <Text style={{ color: accentColor, fontWeight: '700' }}>{selectedIds.size}</Text>
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
          <MaterialCommunityIcons name="plus" size={28} color={currentTheme.bg} />
        </TouchableOpacity>
      )}

    </View>
  );
}