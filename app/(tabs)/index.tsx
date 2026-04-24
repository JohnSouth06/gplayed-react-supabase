import { signOutUser } from '@/api/auth';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TabOneScreen() {
  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ma Collection</Text>
      
      {/* Bouton de déconnexion pour le test */}
      <TouchableOpacity 
        onPress={handleLogout}
        style={styles.logoutBtn}
      >
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  logoutBtn: { marginTop: 20, padding: 15, backgroundColor: '#ff4444', borderRadius: 10 },
  logoutText: { color: '#fff', fontWeight: 'bold' }
});