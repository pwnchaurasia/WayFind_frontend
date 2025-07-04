import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router';

const AuthIndex = () => {
  return (
    <SafeAreaView style={styles.container}> 
       <Link href="/login" style={styles.link}>Go to Login screen</Link>
    </SafeAreaView>
  )
}

export default AuthIndex


const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    link: {
        color: 'blue',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 190
    }
})