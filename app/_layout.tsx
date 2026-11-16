import { AlertProvider } from '../context/AlertContext';
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { authService, useCurrentUser } from '../services/authService';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppSettingsProvider, useAppSettings } from '../context/AppSettingsContext';

export const unstable_settings = {
  anchor: 'index',
};

function ThemedAppContent() {
  const { isDark, colors } = useAppSettings();

  const user = useCurrentUser();
  useEffect(() => {
    if (!user) return;
    const refresh = () => { void authService.refresh().catch(() => {}); };
    const timer = setInterval(refresh, 3500);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [user]);

  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const paperTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      surface: colors.surface,
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <AlertProvider sessionId={user?.id}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="waiting-role" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="staff" options={{ headerShown: false }} />
          <Stack.Screen name="statistics" options={{ headerShown: false }} />
          <Stack.Screen name="salary" options={{ headerShown: false }} />
          <Stack.Screen name="appointment/[id]" options={{ headerShown: false }} />
        </Stack>
      </AlertProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <ThemedAppContent />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}
