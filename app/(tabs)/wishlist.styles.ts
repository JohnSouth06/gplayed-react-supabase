// app/(tabs)/wishlist.styles.ts
import { StyleSheet } from 'react-native';
import { C } from '../../constants/Theme';

export { C };

export const wishlistStyles = StyleSheet.create({
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
    fontWeight: '700',
  },
  countdownText: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  priorityMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityMiniText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 15,
    borderRadius: 14,
    backgroundColor: C.primary,
    marginBottom: 14, // Espace entre ce bouton et le bouton supprimer
  },
  transferBtnText: {
    color: C.bg,
    fontWeight: '700',
    fontSize: 14,
  }
});