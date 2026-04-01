import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WelcomeScreen" />
      <Stack.Screen name="SignInScreen" />
      <Stack.Screen name="OTPScreen" />
      <Stack.Screen name="UserTypeScreen" />
      <Stack.Screen name="ClientLocationFormScreen" />
      <Stack.Screen name="ProfessionalFormScreen" />
      <Stack.Screen name="ProfessionalLocationFormScreen" />
    </Stack>
  );
}
