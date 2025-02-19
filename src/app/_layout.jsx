import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Redirect, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Poppins_600SemiBold,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_500Medium,
  useFonts,
} from "@expo-google-fonts/poppins";


SplashScreen.preventAutoHideAsync();

const RootNavigation = () => {

  const [isAuthenticated, setIsAuthenticated] = useState(true);



  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Poppins_600SemiBold,
    Poppins_300Light,
    Poppins_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
  });
  console.log(loaded)

  useEffect (() => {
    async function hideSplash() {
      if (loaded || error) {
        await SplashScreen.hideAsync();
      }
      
    }
    hideSplash();
  },[loaded, error])

  if (!loaded && !error) {
    console.log("here")
    return null;
  }

  return (
    <>
    <Stack screenOptions={{headerShown: false}}/>
    {
      isAuthenticated ? <Redirect href={"/(main)"}/> : <Redirect href={"/(auth)"}/>
    }
    </>
  )
}

export default RootNavigation 

const styles = StyleSheet.create({})