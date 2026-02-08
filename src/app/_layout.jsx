import { StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import { Stack, useSegments, useRootNavigationState } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/src/context/AuthContext';
import { ToastProvider } from '@/src/context/ToastContext';
import LoadingScreen from '@/src/components/LoadingScreen';

import {
  Poppins_600SemiBold,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_500Medium,
  useFonts,
} from "@expo-google-fonts/poppins";
import { registerGlobals } from '@livekit/react-native';

// Register WebRTC globals for LiveKit
registerGlobals();

SplashScreen.preventAutoHideAsync();

/**
 * RootLayout Component
 * 
 * This is the main entry point of the app using Expo Router.
 * It handles:
 * 1. Font loading
 * 2. Splash screen management
 * 3. Provides authentication context
 * 4. Sets up the Stack navigation structure
 * 5. Provides global Toast notifications
 * 
 * Note: Deep link routes (join/*) are configured to work independently
 * without waiting for auth state to be resolved.
 */
const RootLayout = () => {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Poppins_600SemiBold,
    Poppins_300Light,
    Poppins_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
  });


  useEffect(() => {
    async function hideSplash() {
      if (loaded || error) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [loaded, error])

  // Show loading screen while fonts are loading
  if (!loaded && !error) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
            {/* Join routes are independent modals - they handle their own auth checks */}
            <Stack.Screen
              name="join"
              options={{
                presentation: 'containedModal',
                headerShown: false,
                gestureEnabled: true,
              }}
            />
          </Stack>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

export default RootLayout

const styles = StyleSheet.create({})
