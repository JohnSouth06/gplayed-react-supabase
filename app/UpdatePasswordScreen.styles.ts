// app/UpdatePasswordScreen.styles.ts
import { StyleSheet } from 'react-native';
import { C } from '../constants/Theme';

export { C };

export const getUpdatePasswordStyles = (theme: typeof C, accentColor: string, accentColorDim: string) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center' },
  content: { paddingHorizontal: 24 },
  iconContainer: { width: 72, height: 72, borderRadius: 20, backgroundColor: accentColorDim, borderWidth: 1, borderColor: `${accentColor}44`, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, justifyContent: 'center' },
  title: { color: theme.textPrimary, fontSize: 22, fontWeight: '400', letterSpacing: 0.3 },
  subtitle: { color: theme.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 20, marginBottom: 28 },
  formCard: { backgroundColor: theme.surface, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bg, borderRadius: 14, paddingHorizontal: 16, height: 52, marginBottom: 12, borderWidth: 1, borderColor: theme.border, gap: 12 },
  inputWrapperSuccess: { borderColor: `${accentColor}66`, backgroundColor: `${accentColor}08` },
  inputWrapperError: { borderColor: `${theme.red}66`, backgroundColor: `${theme.red}08` },
  input: { flex: 1, color: theme.textPrimary, fontSize: 15 },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: -4, paddingHorizontal: 4 },
  strengthBarRow: { flexDirection: 'row', gap: 5, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, minWidth: 60, textAlign: 'right' },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, paddingHorizontal: 4 },
  feedbackText: { fontSize: 12, fontWeight: '600' },
  button: { backgroundColor: accentColor, borderRadius: 16, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14, shadowColor: accentColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  buttonDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
  buttonText: { color: theme.bg, fontSize: 15, fontWeight: '600', letterSpacing: 1 },
});