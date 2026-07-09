import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthGuard } from '@mobile/features/auth/components/AuthGuard';
import { AuthProvider } from '@mobile/features/auth/hooks/useAuth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
      <StatusBar style="auto" />
      <Toast />
    </AuthProvider>
  );
}
