import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SplashScreen, Stack } from 'expo-router'
import {
  Poppins_600SemiBold,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_500Medium,
  useFonts,
} from "@expo-google-fonts/poppins";


// SplashScreen.preventAutoHideAsync();

const RootNavigation = () => {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Poppins_600SemiBold,
    Poppins_300Light,
    Poppins_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
  });

  return (
    
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="index"/>
        {/* <Stack.Screen name="(routes)/onboarding/index"/> */}
      </Stack>
  )
}

export default RootNavigation 

const styles = StyleSheet.create({})