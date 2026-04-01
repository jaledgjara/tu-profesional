import { View, Text, StyleSheet } from 'react-native';

export default function ClientLocationFormScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ClientLocationFormScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5F2' },
  text: { fontSize: 20, color: '#27231C' },
});
