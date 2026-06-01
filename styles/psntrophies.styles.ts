// styles/psntrophies.styles.ts
import { StyleSheet } from 'react-native';

export const getCollectionStyles = (theme: any, trophiesColor: string, trophiesDimColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 20, // Ajout du padding global comme sur index.tsx
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
    fontWeight: '400',
    color: theme.textPrimary,
    letterSpacing: 0.5,
  },
  usernameHighlight: {
    color: trophiesColor,
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
    color: trophiesColor,
    fontWeight: '600',
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
    fontWeight: '600',
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
    marginBottom: 12, // Ajout de marge entre les cartes
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
    fontWeight: '700',
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
    fontWeight: '500',
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
    fontWeight: '900',
    marginLeft: 12,
    width: 48,
    textAlign: 'right',
    color: trophiesColor,
  }
});