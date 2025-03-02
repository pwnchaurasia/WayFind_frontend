import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

export default function AuthStackLayout() {
  return (
    <Stack screenOptions={{headerShown: false}}> 
        <Stack.Screen name='index'/>
        {/* <Stack.Screen name='terms_agree'/>
        <Stack.Screen name='login'/>
        <Stack.Screen name='verify_otp'/>
        <Stack.Screen name='update_profile'/> */}
    </Stack>
  )
}