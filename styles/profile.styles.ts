// app/profile.styles.ts
import { StyleSheet } from 'react-native';
import { C } from '../constants/Theme';

export { C };

export const getProfileStyles = (theme: typeof C, accentColor: string, accentColorDim: string) => {
  return {
    sectionStyles: StyleSheet.create({
      row: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10, marginTop: 24, paddingHorizontal: 2 },
      label: { color: accentColor, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2 },
    }),
    menuStyles: StyleSheet.create({
      item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
      iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
      label: { flex: 1, color: theme.textPrimary, fontSize: 14, fontWeight: '600' },
    }),
    styles: StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.bg },
      centered: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
      content: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 20 },
      header: { alignItems: 'center', marginBottom: 8, marginTop: 20 },
      avatarRing: { width: 116, height: 116, borderRadius: 58, borderWidth: 2, borderColor: `${accentColor}66`, padding: 3, marginBottom: 4 },
      avatarWrapper: { flex: 1, borderRadius: 55, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
      avatarImage: { width: '100%', height: '100%', borderRadius: 55 },
      avatarLetter: { color: accentColor, fontSize: 42, fontWeight: '600' },
      uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(39,39,39,0.75)', justifyContent: 'center', alignItems: 'center', borderRadius: 55 },
      editBadge: { position: 'absolute', bottom: 6, right: 0, backgroundColor: accentColor, width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: theme.bg, shadowColor: accentColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
      progressTrack: { width: 120, height: 3, backgroundColor: theme.border, borderRadius: 2, marginTop: 12, overflow: 'hidden' },
      progressFill: { height: '100%', backgroundColor: accentColor, borderRadius: 2 },
      usernamRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
      username: { color: theme.textPrimary, fontSize: 22, fontWeight: '400', letterSpacing: 0.3 },
      memberLabel: { color: theme.textMuted, fontSize: 12, fontWeight: '300', marginTop: 5, textTransform: 'uppercase', letterSpacing: 1.5 },
      card: { backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
      dangerCard: { borderColor: `${theme.red}33`, backgroundColor: theme.redDim },
      menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
      menuIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
      menuText: { flex: 1, color: theme.textPrimary, fontSize: 14, fontWeight: '600' },
      logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, paddingVertical: 12 },
      logoutLabel: { color: theme.textMuted, fontSize: 14, fontWeight: '600' },
    })
  };
};