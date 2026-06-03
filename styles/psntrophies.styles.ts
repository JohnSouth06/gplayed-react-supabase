// styles/psntrophies.styles.ts
import { Dimensions, StyleSheet } from 'react-native';

const { height } = Dimensions.get('window');

export const getCollectionStyles = (theme: any, trophiesColor: string, trophiesDimColor: string) => {
  const isLight = theme.bg === '#ffffff';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
      paddingHorizontal: 20,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.bg,
    },
    
    /* --- HEADER (Titre et sous-titre) --- */
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
      fontFamily: 'SpaceGrotesk_700Bold',
      color: theme.textPrimary,
      letterSpacing: 0.5,
    },
    usernameHighlight: {
      color: trophiesColor,
      fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    count: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: 'SpaceGrotesk_500Medium',
      marginTop: 10,
      marginLeft: 1,
    },
    countNum: {
      color: trophiesColor,
      fontFamily: 'SpaceGrotesk_600SemiBold',
    },

    /* --- BARRE DE RECHERCHE --- */
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
    collectionSearchInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 14,
      marginLeft: 10,
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

    /* --- LISTE ET CARTES --- */
    listContent: {
      paddingBottom: 40,
    },
    emptyContainer: {
      padding: 30,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
      backgroundColor: theme.surfaceHigh,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 15,
      textAlign: 'center',
      fontFamily: 'SpaceGrotesk_600SemiBold',
      color: theme.textSecondary,
    },
    emptySubText: {
      marginTop: 8,
      fontSize: 13,
      textAlign: 'center',
      color: theme.textMuted,
    },
    card: {
      flexDirection: 'row',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceHigh,
      alignItems: 'center',
      marginBottom: 12,
    },
    cover: {
      width: 65,
      height: 65,
      borderRadius: 10,
      marginRight: 14,
      backgroundColor: trophiesDimColor,
    },
    info: {
      flex: 1,
      justifyContent: 'center',
    },
    titleCard: {
      fontSize: 15,
      fontFamily: 'SpaceGrotesk_700Bold',
      marginBottom: 6,
      color: theme.textPrimary,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    statsText: {
      fontSize: 13,
      marginLeft: 6,
      color: theme.textSecondary,
      fontFamily: 'SpaceGrotesk_500Medium',
    },
    progressBarBg: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      backgroundColor: trophiesDimColor,
      width: '100%',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: trophiesColor,
    },
    progressText: {
      fontSize: 17,
      fontFamily: 'SpaceGrotesk_700Bold',
      marginLeft: 12,
      width: 48,
      textAlign: 'right',
      color: trophiesColor,
    },

    /* --- COPIE CONFORME DES STYLES DE LA MODALE DE INDEX.STYLES.TS --- */
    detailModalOverlay: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    detailModalContent: { flex: 1 },
    detailHeader: {
      height: height * 0.34,
      justifyContent: 'flex-end',
      overflow: 'hidden',
      position: 'relative',
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
      color: isLight ? '#ffffff' : theme.textPrimary,
      fontSize: 21,
      fontFamily: 'SpaceGrotesk_600SemiBold',
      letterSpacing: 0.3,
      textShadowColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.9)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: isLight ? 4 : 8,
    },
    detailPlatformRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 7,
    },
    detailDev: {
      color: trophiesColor,
      fontSize: 12,
      fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    closeDetailBtn: {
      position: 'absolute',
      top: 52,
      right: 18,
      backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)',
      padding: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isLight ? '#dddddd' : theme.border,
      zIndex: 10,
    },
  });
};