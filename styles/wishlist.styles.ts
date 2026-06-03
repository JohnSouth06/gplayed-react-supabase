// styles/wishlist.styles.ts
import { StyleSheet } from 'react-native';

export const getWishlistStyles = (theme: any, accentColor: string) => StyleSheet.create({
  cardCountdownBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cardCountdownText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  countdownText: {
    color: accentColor,
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    marginTop: 2,
  },
  desireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 15,
    borderRadius: 14,
    backgroundColor: accentColor,
    marginBottom: 14, 
  },
  transferBtnText: {
    color: theme.bg,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
  },
  
  /* --- STYLES DES SUGGESTIONS --- */
  suggestionContainer: {
    marginHorizontal: 0,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border || `${theme.textSecondary}15`,
  },
  suggestionHeader: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 12, 
  },
  suggestionHeaderLeft: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6
  },
  suggestionTitle: {
    fontSize: 13, 
    fontFamily: 'SpaceGrotesk_600SemiBold', 
    color: theme.textSecondary,
  },
  suggestionListContent: {
    paddingHorizontal: 12, 
    gap: 12
  },
  suggestionItem: {
    width: 85
  },
  suggestionCover: {
    width: 85, 
    height: 120,
    borderRadius: 8, 
    backgroundColor: theme.bg 
  },
  suggestionText: {
    color: theme.textPrimary, 
    marginTop: 5, 
    fontSize: 11, 
    fontFamily: 'SpaceGrotesk_500Medium' 
  },
  suggestionCover: {
    width: 85, 
    height: 120,
    borderRadius: 8, 
    backgroundColor: theme.bg 
  },
  suggestionText: {
    color: theme.textPrimary, 
    marginTop: 5, 
    fontSize: 11, 
    fontFamily: 'SpaceGrotesk_500Medium' 
  },
  
  /* --- STYLES DES ONGLETS (TABS) --- */
  tabWrapper: {
    flex: 1,
  },
  activeTabShadowContainer: {
    flex: 1,
  },
  activeTabShadowStyle: {
    width: '100%',
    borderRadius: 11,
  }
});