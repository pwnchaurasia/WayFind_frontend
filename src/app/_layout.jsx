import { StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/src/context/AuthContext';
import LoadingScreen from '@/src/components/LoadingScreen';
import AuthGuard from '@/src/components/AuthGuard';


import {
  Poppins_600SemiBold,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_500Medium,
  useFonts,
} from "@expo-google-fonts/poppins";


SplashScreen.preventAutoHideAsync();


/**
 * RootNavigation Component
 * 
 * This is the main entry point of the app. It handles:
 * 1. Font loading
 * 2. Splash screen management
 * 3. Provides authentication context
 * 4. Renders the AuthGuard for routing logic
 */
const RootNavigation = () => {
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
        <AuthGuard />
      </AuthProvider>
    </SafeAreaProvider>
  )
}

export default RootNavigation

const styles = StyleSheet.create({})
