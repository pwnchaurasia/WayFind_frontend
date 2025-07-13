import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Redirect, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/src/context/AuthContext';
import LoadingScreen from '@/src/components/LoadingScreen';
import { useAuth } from '@/src/context/AuthContext';


import {
  Poppins_600SemiBold,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_500Medium,
  useFonts,
} from "@expo-google-fonts/poppins";


SplashScreen.preventAutoHideAsync();


const AppNavigator = () => {

  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
      <Stack screenOptions={{headerShown: false}}>
        { 
          isAuthenticated ? 
            ( <Stack.Screen name="(main)" redirect />) 
          : 
            (<Stack.Screen name="(auth)" redirect />)
        }
      </Stack>
  );
};



const RootNavigation = () => {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add this

  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Poppins_600SemiBold,
    Poppins_300Light,
    Poppins_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
  });
  

  useEffect (() => {
    async function hideSplash() {
      if (loaded || error) {
        await SplashScreen.hideAsync();
      }
      
    }
    hideSplash();
  },[loaded, error])

  if (!loaded && !error) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider> 
        <AppNavigator/>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

export default RootNavigation 

const styles = StyleSheet.create({})
