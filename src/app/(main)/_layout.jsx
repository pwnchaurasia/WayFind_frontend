import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const MainStackLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}> 
      {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
      <Stack.Screen name="index" />
      <Stack.Screen name="group/[id]" />
    </Stack>
  )
}

export default MainStackLayout