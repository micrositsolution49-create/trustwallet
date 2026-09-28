import "@/polyfills";
import 'react-native-get-random-values';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { AuthProvider, useAuth } from "@/context/AuthContext";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { hasWallet, unlocked, isReady, refresh } = useAuth();

  useEffect(() => {
    refresh().then(() => SplashScreen.hideAsync());
  }, [refresh]);

  useEffect(() => {
    if (!isReady) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!hasWallet && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (hasWallet && !unlocked && !inAuthGroup) {
      router.replace("/(auth)/unlock");
    } else if (hasWallet && unlocked && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isReady, hasWallet, unlocked, segments, router]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}