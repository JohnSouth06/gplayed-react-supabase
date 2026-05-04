// app/UpdatePasswordScreen.styles.ts
import { StyleSheet } from 'react-native';
import { C } from '../constants/Theme';

export { C };

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
  },

  // HEADER
  headerAvatarContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: `${C.primary}44`,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerAvatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.primaryDim,
    borderWidth: 1,
    borderColor: `${C.primary}44`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    justifyContent: 'center',
  },
  title: {
    color: C.textPrimary,
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: C.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 28,
  },

  // FORM CARD
  formCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  inputWrapperSuccess: {
    borderColor: `${C.primary}66`,
    backgroundColor: `${C.primary}08`,
  },
  inputWrapperError: {
    borderColor: `${C.red}66`,
    backgroundColor: `${C.red}08`,
  },
  input: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 15,
  },

  // STRENGTH INDICATOR
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: -4,
    paddingHorizontal: 4,
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: 5,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    minWidth: 60,
    textAlign: 'right',
  },

  // FEEDBACK
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -6,
    paddingHorizontal: 4,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // BUTTON
  button: {
    backgroundColor: C.primary,
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: C.bg,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // BACK
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  backText: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});