import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function UserTypeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>UserTypeScreen</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(client)/home')}>
        <Text style={styles.buttonText}>Soy cliente</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => router.replace('/(professional)/home')}>
        <Text style={styles.buttonText}>Soy profesional</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#F7F5F2' },
  title: { fontSize: 20, color: '#27231C', marginBottom: 8 },
  button: { backgroundColor: '#2E6CC8', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 9999, minWidth: 200 },
  buttonSecondary: { backgroundColor: '#2CA89E' },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16 },
});
