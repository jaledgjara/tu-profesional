import { Tabs } from 'expo-router';

export default function ProfessionalLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="briefcase" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
