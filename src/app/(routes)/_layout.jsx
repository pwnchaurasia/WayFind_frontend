import { Stack } from "expo-router";
import React from 'react'

const Routeslayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
    </Stack>
  )
}

export default Routeslayout