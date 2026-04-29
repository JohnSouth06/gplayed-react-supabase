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
  ScrollView, StyleSheet, Text,
  TextInput,
  TouchableOpacity, View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

const C = {
  bg: '#1e1e1e',
  surface: '#272727',
  surfaceHigh: '#2e2e2e',
  border: '#3D3D3D',
  borderAccent: '#4CE5AE22',
  primary: '#e54c60',
  primaryDim: 'rgba(229, 76, 96, 0.12)',
  primaryGlow: 'rgba(229, 76, 94, 0.25)',
  textPrimary: '#F0F0F0',
  textSecondary: '#7A8C86',
  textMuted: '#677a73',
  red: '#FF4C4C',
  redDim: 'rgba(255,76,76,0.12)',
  blue: '#72ecfe',
  yellow: '#FFD34C',
  grey: '#c5dcd3',
};

const SORT_OPTIONS = [
  { id: 'recent', label: 'Ajouts récents', icon: 'clock-outline' },
  { id: 'title', label: 'Nom (A-Z)', icon: 'sort-alphabetical-variant' },
];

const PRIORITIES = [
  { id: 'Basse',   label: 'Pas pressé',  icon: 'sleep',    color: C.grey,   level: 1 },
  { id: 'Moyenne', label: 'Je le veux',  icon: 'cards-heart', color: C.blue,   level: 2 },
  { id: 'Haute',   label: 'Très envie',  icon: 'lightning-bolt',   color: C.yellow, level: 3 },
  { id: 'Urgente', label: 'ASAP !',      icon: 'fire',             color: C.red,    level: 4 },
];

export default function WishlistScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'Physique' | 'Numérique'>('Physique');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'manage' | 'info'>('manage');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // On filtre uniquement sur le statut 'wishlist'
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Wishlist');

      if (error) throw error;
      setWishlist(data || []);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();
      if (profileData) setUsername(profileData.username);

    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getProcessedGames = () => {
    let filtered = wishlist.filter(game =>
      game.format === activeFormat &&
      game.title.toLowerCase().includes(collectionSearchQuery.toLowerCase())
    );
    switch (sortBy) {
      case 'title': return filtered.sort((a, b) => a.title.localeCompare(b.title));
      default: return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  };

  const updateGameField = async (field: string, value: any) => {
    try {
      const { error } = await supabase.from('games').update({ [field]: value }).eq('id', selectedGame.id);
      if (error) throw error;
      setSelectedGame({ ...selectedGame, [field]: value });
      setWishlist(wishlist.map(g => g.id === selectedGame.id ? { ...g, [field]: value } : g));
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  const moveToCollection = async () => {
    Alert.alert(
      "Ajouter à la collection ?",
      "Ce jeu passera de votre wishlist à votre collection principale (Statut: À faire).",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              const { error } = await supabase.from('games').update({ status: 'A faire' }).eq('id', selectedGame.id);
              if (error) throw error;
              setDetailModalVisible(false);
              fetchWishlist();
            } catch (e: any) {
              Alert.alert("Erreur", e.message);
            }
          }
        }
      ]
    );
  };

  const deleteWishItem = () => {
    Alert.alert("Retirer de la wishlist ?", "Voulez-vous supprimer ce souhait ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          await supabase.from('games').delete().eq('id', selectedGame.id);
          setDetailModalVisible(false);
          fetchWishlist();
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
        const flattened: any[] = [];
        data.forEach(game => {
          if (game.platforms && game.platforms.length > 0) {
            game.platforms.forEach((p: any) => {
              flattened.push({ ...game, selectedPlatform: p.name, uniqueSearchId: `${game.id}-${p.id}` });
            });
          } else {
            flattened.push({ ...game, selectedPlatform: 'PC', uniqueSearchId: game.id.toString() });
          }
        });
        setResults(flattened);
      }
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addGameToWishlist = async (game: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      let formattedReleaseDate = null;
      if (game.first_release_date) {
        const dateObj = new Date(game.first_release_date * 1000);
        formattedReleaseDate = dateObj.toISOString().split('T')[0];
      }

      const newGame = {
        user_id: user.id,
        igdb_id: game.id,
        title: game.name,
        description: game.summary,
        rating_igdb: game.total_rating,
        cover_url: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
        genres: game.genres?.map((g: any) => g.name) || [],
        game_modes: game.game_modes?.map((m: any) => m.name) || [],
        screenshots: game.screenshots?.map((s: any) => `https:${s.url.replace('t_thumb', 't_1080p')}`) || [],
        developer: game.involved_companies?.find((c: any) => c.developer)?.company.name || null,
        publisher: game.involved_companies?.find((c: any) => c.publisher)?.company.name || null,
        engine: game.game_engines?.[0]?.name || null,
        platform: game.selectedPlatform,
        platforms_list: game.platforms?.map((p: any) => p.name) || [],
        format: activeFormat,
        status: 'Wishlist', // Forcé en wishlist
        priority: 'Moyenne', // Valeur par défaut spécifique à la wishlist
        release_date: formattedReleaseDate
      };

      const { error } = await supabase.from('games').upsert(newGame, { onConflict: 'user_id, igdb_id, platform' });
      if (error) throw error;

      setModalVisible(false);
      setSearchQuery('');
      fetchWishlist();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getPriorityInfo = (prio: string) => PRIORITIES.find(p => p.id === prio) || PRIORITIES[1];

  const processedGames = getProcessedGames();

  const formatDate = (dateString: string) => {
    if (!dateString) return "Inconnue";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Helper pour calculer les jours avant sortie
  // Retourne { label, isUrgent } ou null si déjà sorti
  // TODO (push notifications) : utiliser shouldNotify() pour déclencher
  // Expo Notifications quand diff vaut 3, 2, 1 ou 0
  const getReleaseCountdown = (dateString: string): { label: string; isUrgent: boolean } | null => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const release = new Date(dateString);
    release.setHours(0, 0, 0, 0);
    const diff = Math.round((release.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diff < 0)  return null; // Jeu déjà sorti
    if (diff === 0) return { label: "Aujourd'hui !", isUrgent: true };
    if (diff === 1) return { label: 'Demain !',       isUrgent: true };
    if (diff <= 3)  return { label: `J-${diff}`,      isUrgent: true };
    if (diff <= 30) return { label: `${diff} jours`,  isUrgent: false };
    const months = Math.floor(diff / 30);
    if (months < 12) return { label: `~${months} mois`, isUrgent: false };
    return { label: formatDate(dateString), isUrgent: false };
  };

  // Indique si une notification push doit être programmée pour ce jeu
  // (à brancher sur Expo Notifications / schedulePushNotificationAsync)
  // const shouldNotify = (daysLeft: number) => [0, 1, 2, 3].includes(daysLeft);

  return (
    <View style={styles.container}>
      <FlatList
        data={processedGames}
        key={viewMode}
        numColumns={viewMode === 'grid' ? 2 : 1}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchWishlist} tintColor={C.primary} />}

        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Ma <Text style={styles.usernameHighlight}>Wishlist</Text></Text>
                <Text style={styles.count}>
                  <Text style={styles.countNum}>{processedGames.length}</Text> jeux {activeFormat.toLowerCase()} dans la wishlist
                </Text>
              </View>
            </View>

            {/* ─── TABS FORMAT ──────────────────────────────────────── */}
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
                  placeholder="Rechercher un souhait..."
                  placeholderTextColor={C.textMuted}
                  value={collectionSearchQuery}
                  onChangeText={setCollectionSearchQuery}
                />
              </View>

              <TouchableOpacity style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
                <MaterialCommunityIcons name="sort-variant" size={22} color={C.primary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.sortButton} onPress={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}>
                <MaterialCommunityIcons name={viewMode === 'grid' ? 'view-list-outline' : 'view-grid-outline'} size={22} color={C.primary} />
              </TouchableOpacity>
            </View>
          </View>
        }

        renderItem={({ item }) => {
          const prioInfo = getPriorityInfo(item.priority || 'Moyenne');
          const countdown = item.release_date ? getReleaseCountdown(item.release_date) : null;

          return (
            <TouchableOpacity
              style={viewMode === 'grid' ? styles.card : styles.listItem}
              onPress={() => { setSelectedGame(item); setDetailModalVisible(true); setDetailTab('manage'); }}
            >
              {/* Image & Overlay */}
              <View style={viewMode === 'grid' ? styles.cardImageWrapper : styles.listCoverWrapper}>
                <Image source={{ uri: item.cover_url }} style={viewMode === 'grid' ? styles.cardCover : styles.listCover} />
                {/* Countdown overlay : uniquement en vue grille (image assez grande) */}
                {viewMode === 'grid' && countdown && (
                  <View style={[styles.countdownBadge, countdown.isUrgent && styles.countdownBadgeUrgent]}>
                    <Text style={[styles.countdownText, countdown.isUrgent && styles.countdownTextUrgent]}>
                      {countdown.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Infos */}
              <View style={viewMode === 'grid' ? styles.cardInfo : styles.listInfo}>
                <Text style={viewMode === 'grid' ? styles.cardTitle : styles.listTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardBadgesRow}>
                  {/* Indicateur priorité : points de niveau + label en vue liste */}
                  <View style={styles.priorityDotsRow}>
                    {[1, 2, 3, 4].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.priorityDot,
                          { backgroundColor: i <= prioInfo.level ? prioInfo.color : `${prioInfo.color}28` },
                        ]}
                      />
                    ))}
                    {viewMode === 'list' && (
                      <Text style={[styles.priorityDotsLabel, { color: prioInfo.color }]}>{prioInfo.label}</Text>
                    )}
                  </View>
                  <PlatformBadge platform={item.platform} />
                </View>
                {/* Countdown inline en vue liste */}
                {viewMode === 'list' && countdown && (
                  <View style={[styles.listCountdownBadge, countdown.isUrgent && styles.listCountdownBadgeUrgent]}>
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      size={10}
                      color={countdown.isUrgent ? C.yellow : C.textSecondary}
                    />
                    <Text style={[styles.listCountdownText, countdown.isUrgent && styles.listCountdownTextUrgent]}>
                      {countdown.label}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ─── MODALE DÉTAIL (ADAPTÉE) ─────────────────────────── */}
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
                      <Text style={styles.detailTitle}>{selectedGame.title}</Text>
                      <Text style={styles.detailDev}>{selectedGame.platform}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setDetailModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={20} color={C.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSubTabs}>
                  {(['manage', 'info'] as const).map((tab) => (
                    <TouchableOpacity key={tab} style={[styles.subTab, detailTab === tab && styles.activeSubTab]} onPress={() => setDetailTab(tab)}>
                      <Text style={[styles.subTabText, detailTab === tab && styles.activeSubTabText]}>
                        {tab === 'manage' ? 'SOUHAIT' : 'INFOS'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <ScrollView style={styles.detailScroll}>
                  {detailTab === 'manage' ? (
                    <View style={styles.manageContainer}>
                      <TouchableOpacity style={styles.promoteBtn} onPress={moveToCollection}>
                        <MaterialCommunityIcons name="plus-circle" size={20} color={C.bg} />
                        <Text style={styles.promoteBtnText}>Ajouter à ma collection</Text>
                      </TouchableOpacity>

                      {selectedGame.release_date && (
                        <>
                          <Text style={styles.sectionTitle}>Date de sortie</Text>
                          <View style={styles.dateBlock}>
                            <View style={styles.dateInfo}>
                              <MaterialCommunityIcons name="calendar-clock" size={20} color={C.primary} />
                              <Text style={styles.dateText}>{formatDate(selectedGame.release_date)}</Text>
                            </View>

                            {(() => {
                              const cd = getReleaseCountdown(selectedGame.release_date);
                              if (cd) {
                                return (
                                  <View style={[styles.dateBadge, cd.isUrgent && styles.dateBadgeUrgent]}>
                                    <Text style={[styles.dateBadgeText, cd.isUrgent && styles.dateBadgeTextUrgent]}>
                                      {cd.label}
                                    </Text>
                                  </View>
                                );
                              }
                              return (
                                <View style={styles.dateBadgeReleased}>
                                  <MaterialCommunityIcons name="check-circle-outline" size={13} color={C.primary} />
                                  <Text style={styles.dateBadgeReleasedText}>Disponible</Text>
                                </View>
                              );
                            })()}
                          </View>
                        </>
                      )}

                      <Text style={styles.sectionTitle}>Format souhaité</Text>
                      <View style={styles.formatToggle}>
                        {(['Physique', 'Numérique'] as const).map((f) => (
                          <TouchableOpacity
                            key={f}
                            style={[styles.formatBtn, selectedGame.format === f && styles.activeFormatBtn]}
                            onPress={() => updateGameField('format', f)}
                          >
                            <Text style={[styles.formatBtnText, selectedGame.format === f && styles.activeFormatBtnText]}>{f}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.sectionTitle}>Priorité d'achat</Text>
                      <View style={styles.priorityCardGrid}>
                        {PRIORITIES.map((p) => {
                          const isActive = selectedGame.priority === p.id;
                          return (
                            <TouchableOpacity
                              key={p.id}
                              style={[styles.priorityCard, isActive && { borderColor: p.color, backgroundColor: `${p.color}18` }]}
                              onPress={() => updateGameField('priority', p.id)}
                            >
                              <View style={styles.priorityCardTop}>
                                <MaterialCommunityIcons
                                  name={p.icon as any}
                                  size={22}
                                  color={isActive ? p.color : C.textMuted}
                                />
                                {isActive && (
                                  <MaterialCommunityIcons name="check-circle" size={14} color={p.color} />
                                )}
                              </View>
                              <Text style={[styles.priorityCardLabel, isActive && { color: p.color }]}>
                                {p.label}
                              </Text>
                              {/* Indicateur de niveau */}
                              <View style={styles.priorityCardDots}>
                                {[1, 2, 3, 4].map(i => (
                                  <View
                                    key={i}
                                    style={[
                                      styles.priorityCardDot,
                                      { backgroundColor: i <= p.level ? p.color : `${p.color}28` },
                                    ]}
                                  />
                                ))}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <TouchableOpacity style={styles.deleteBtn} onPress={deleteWishItem}>
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
                        <DetailRow label="Date de sortie" value={selectedGame.release_date ? formatDate(selectedGame.release_date) : null} />
                        <DetailRow label="Éditeur" value={selectedGame.publisher} />
                        <DetailRow label="Développeur" value={selectedGame.developer} />
                        <DetailRow label="Moteur" value={selectedGame.engine} />
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

      {/* ─── MODALE DE TRI ────────────────────────────────────── */}
      <Modal visible={sortModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
          <View style={styles.sortModalContent}>
            <Text style={styles.modalTitle}>Trier la wishlist par</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.sortOption, sortBy === option.id && styles.activeSortOption]}
                onPress={() => { setSortBy(option.id as any); setSortModalVisible(false); }}
              >
                <MaterialCommunityIcons name={option.icon as any} size={18} color={sortBy === option.id ? C.primary : C.textSecondary} />
                <Text style={[styles.sortOptionText, sortBy === option.id && styles.activeSortOptionText]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODALE RECHERCHE IGDB ───────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalSearchContainer}>
          <View style={styles.modalSearchContent}>
            <View style={styles.searchHeader}>
              <View style={styles.searchInputWrapper}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Chercher un jeu désiré..."
                  placeholderTextColor={C.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  autoFocus
                />
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeText}>Fermer</Text></TouchableOpacity>
            </View>
            {searching ? <ActivityIndicator color={C.primary} /> : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.uniqueSearchId}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.searchItem} onPress={() => addGameToWishlist(item)}>
                    <Image source={{ uri: `https:${item.cover?.url}` }} style={styles.searchThumbnail} />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.searchTitle}>{item.name}</Text>
                      <Text style={styles.searchPlatform}>{item.selectedPlatform}</Text>
                    </View>
                    <View style={styles.addBtn}><MaterialCommunityIcons name="heart-outline" size={18} color={C.bg} /></View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ─── MODALE VISIONNEUSE D'IMAGE ──────────────────────── */}
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

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialCommunityIcons name="heart-plus" size={28} color={C.bg} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Composants réutilisés de index.tsx ──────────────────────────

const PlatformBadge = ({ platform }: { platform: string }) => {
  const p = platform?.toLowerCase() || '';
  let icon = 'gamepad-variant-outline';
  let bg = C.textMuted;
  if (p.includes('playstation')) { icon = 'sony-playstation'; bg = '#003791'; }
  if (p.includes('switch') || p.includes('nintendo')) { icon = 'nintendo-switch'; bg = '#E4000F'; }
  if (p.includes('xbox')) { icon = 'microsoft-xbox'; bg = '#107C10'; }
  if (p.includes('pc')) { icon = 'microsoft-windows'; bg = '#555E68'; }

  return (
    <View style={[badgeStyles.platformBadge, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon as any} size={10} color="#fff" />
      <Text style={badgeStyles.platformBadgeText}>{platform}</Text>
    </View>
  );
};

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

const badgeStyles = StyleSheet.create({
  platformBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  platformBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

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
  usernameHighlight: {
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
  sortButton: {
    backgroundColor: C.surface,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
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
  collectionSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
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
  cardPlatform: {
    color: C.textSecondary,
    fontSize: 10,
    marginTop: 3,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  statusOptionText: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  playtimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    padding: 14,
    borderRadius: 14,
    gap: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.border,
  },
  playtimeInput: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  playtimeLabel: {
    color: C.textSecondary,
    fontWeight: '700',
    fontSize: 13,
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
    opacity: 0.5, // Rend l'élément translucide
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
  // WISHLIST — PRIORITY DOTS (remplacement du prioTag textuel)
  priorityDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityDotsLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 5,
    letterSpacing: 0.2,
  },

  // COUNTDOWN BADGE (vue grille — overlay sur l'image)
  countdownBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  countdownBadgeUrgent: {
    backgroundColor: 'rgba(255,211,76,0.18)',
    borderColor: 'rgba(255,211,76,0.4)',
  },
  countdownText: {
    color: C.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },
  countdownTextUrgent: {
    color: C.yellow,
  },

  // COUNTDOWN BADGE INLINE (vue liste)
  listCountdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  listCountdownBadgeUrgent: {
    backgroundColor: 'rgba(255,211,76,0.1)',
    borderColor: 'rgba(255,211,76,0.35)',
  },
  listCountdownText: {
    color: C.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  listCountdownTextUrgent: {
    color: C.yellow,
  },

  // SÉLECTEUR DE PRIORITÉ (modal détail) — grille 2×2 visuelle
  priorityCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 24,
  },
  priorityCard: {
    width: (width - 40 - 9) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
    gap: 8,
  },
  priorityCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityCardLabel: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  priorityCardDots: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityCardDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  // DATE BADGE — état "Disponible" (jeu déjà sorti)
  dateBadgeReleased: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${C.primary}44`,
  },
  dateBadgeReleasedText: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  promoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4CE5AE', // Correspond à C.primary
    padding: 15,
    borderRadius: 14,
    marginBottom: 10,
  },
  promoteBtnText: {
    color: '#1e1e1e', // Correspond à C.bg
    fontWeight: '800',
    fontSize: 14,
  },
  // RELEASE DATE COUNTDOWN
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 15,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: C.border,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  dateBadge: {
    backgroundColor: 'rgba(255, 211, 76, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 211, 76, 0.4)',
  },
  dateBadgeText: {
    color: '#FFD34C', // C.yellow
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  }
});