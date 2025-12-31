import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const MainStackLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="organization" />
      <Stack.Screen name="rides" />
    </Stack>
  )
}

export default MainStackLayout
