// app/(tabs)/index.styles.ts
import { Dimensions, StyleSheet } from 'react-native';
import { C } from '../../constants/Theme';

export { C };

const { width, height } = Dimensions.get('window');
export const COLUMN_WIDTH = (width - 60) / 2;

// ─── Options de tri (Purement UI) ──────────────────────────────────────────
export const SORT_OPTIONS = [
  { id: 'recent', label: 'Ajouts récents', icon: 'clock-outline' },
  { id: 'title', label: 'Nom (A-Z)', icon: 'sort-alphabetical-variant' },
  { id: 'rating', label: 'Note IGDB', icon: 'star-outline' },
  { id: 'playtime', label: 'Temps de jeu', icon: 'timer-outline' },
];

// ─── Helpers UI ─────────────────────────────────────────────────────────────
export const getPlatformInfo = (platform: string): { icon: string; bg: string; label: string } => {
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

export const getRatingColor = (rating: number): string => {
  if (rating >= 80) return '#4CE5AE';
  if (rating >= 60) return '#FFD34C';
  return '#FF6B6B';
};

// ─── Styles ─────────────────────────────────────────────────────────────────
export const badgeStyles = StyleSheet.create({
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
  igdbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  igdbBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export const getBaseStyles = (theme: typeof C, accentColor: string, accentColorDim: string) => StyleSheet.create({

  // LAYOUT
  container: {
    flex: 1,
    backgroundColor: theme.bg,
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
    color: theme.textPrimary,
    letterSpacing: 0.5,
  },
  usernameHighlight: {
    color: accentColor,
    fontWeight: '600',
  },
  count: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    marginLeft: 1,
  },
  countNum: {
    color: accentColor,
    fontWeight: '600',
  },
  sortButton: {
    backgroundColor: theme.surface,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },

  // TABS
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: accentColor,
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  tabText: {
    color: theme.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  activeTabText: {
    color: theme.bg,
  },

  // SEARCH BAR
  collectionSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
    height: 44,
    borderWidth: 1,
    borderColor: theme.border,
  },
  collectionSearchInput: {
    flex: 1,
    color: theme.textPrimary,
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
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: theme.border,
  },

  sortButton: {
    backgroundColor: theme.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: theme.surface,
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
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardPlatform: {
    color: theme.textSecondary,
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
    color: theme.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: theme.textMuted,
    fontSize: 13,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: accentColor,
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },

  // DETAIL MODAL
  detailModalOverlay: {
    flex: 1,
    backgroundColor: theme.bg,
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
    color: theme.textPrimary,
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
    color: accentColor,
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
    borderColor: theme.border,
  },

  // DETAIL SUBTABS
  detailSubTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.bg,
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
    borderBottomColor: accentColor,
  },
  subTabText: {
    color: theme.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.2,
  },
  activeSubTabText: {
    color: accentColor,
  },
  detailScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    color: accentColor,
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
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: accentColor,
  },
  formatBtnText: {
    color: theme.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  activeFormatBtnText: {
    color: theme.bg,
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
    borderColor: theme.border,
    marginRight: 8,
    backgroundColor: theme.surface,
  },
  activePill: {
    borderColor: accentColor,
    backgroundColor: accentColorDim,
  },
  pillText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activePillText: {
    color: accentColor,
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
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  statusOptionText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  playtimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 14,
    gap: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: theme.border,
  },
  playtimeInput: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  playtimeLabel: {
    color: theme.textSecondary,
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
    borderColor: `${theme.red}44`,
    backgroundColor: theme.redDim,
  },
  deleteBtnText: {
    color: theme.red,
    fontWeight: '700',
    fontSize: 14,
  },

  // LIST VIEW
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 14,
    marginBottom: 10,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  listItemSelected: {
    borderColor: accentColor,
    backgroundColor: accentColorDim,
    shadowColor: accentColor,
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
    backgroundColor: theme.surfaceHigh,
  },
  listInfo: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  listTitle: {
    color: theme.textPrimary,
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
    borderColor: theme.border,
    backgroundColor: theme.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // CARD SELECTION
  cardSelected: {
    borderWidth: 2,
    borderColor: accentColor,
    shadowColor: accentColor,
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
    backgroundColor: accentColor,
    borderColor: accentColor,
  },

  // SELECTION ACTION BAR
  selectionBar: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceHigh,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectionBarText: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectionDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: theme.red,
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
    backgroundColor: theme.surface,
    padding: 18,
    borderRadius: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: theme.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  detailLabel: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: theme.textPrimary,
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
    backgroundColor: theme.surface,
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
    borderColor: theme.border,
  },

  // SORT MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: theme.surface,
    width: '82%',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sortModalHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    color: theme.textPrimary,
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
    backgroundColor: accentColorDim,
    borderColor: `${accentColor}44`,
  },
  sortIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIconWrapActive: {
    backgroundColor: accentColor,
  },
  sortOptionText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeSortOptionText: {
    color: accentColor,
    fontWeight: '700',
  },

  // SEARCH MODAL
  modalSearchContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'flex-end',
  },
  modalSearchContent: {
    backgroundColor: theme.surface,
    height: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  searchModalHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.border,
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
    backgroundColor: theme.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 14,
  },
  closeSearchBtn: {
    paddingHorizontal: 4,
  },
  closeText: {
    color: accentColor,
    fontWeight: '700',
    fontSize: 14,
  },
  searchItem: {
    flexDirection: 'row',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    alignItems: 'center',
  },
  searchThumbnail: {
    width: 48,
    height: 66,
    borderRadius: 9,
    backgroundColor: theme.bg,
  },
  searchTitle: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  searchPlatform: {
    color: accentColor,
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
    backgroundColor: accentColor,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});