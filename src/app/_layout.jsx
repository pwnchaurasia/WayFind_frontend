import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen';
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

    if (loaded || error) {
      SplashScreen.hideAsync();
    }

  },[loaded, error])
console.log(loaded)
console.log(error)
  if (!loaded && !error) {
    console.log("here")
    return null;
  }
  console.log("I am here")

  return (
    
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="index"/>
        {/* <Stack.Screen name="(routes)/onboarding/index"/> */}
      </Stack>
  )
}

export default RootNavigation 

const styles = StyleSheet.create({})