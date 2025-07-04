import { StyleSheet, Text, View, Image, 
  PixelRatio,Dimensions } from 'react-native'
import React from 'react'
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import {theme} from '@/src/styles/theme';
import imagePath from '@/src/constants/imagePath';




const scale = PixelRatio.get();
const { width, height } = Dimensions.get('window');


const LogoSection = () => {
  return (
    <View style={styles.logoContainer}>
      <Image 
        source={imagePath.icon} 
        style={styles.logo}
        resizeMode='contain'
        />
      <Text style={styles.appName}>WayFind</Text>
    </View>
  )
}

export default LogoSection

const styles = StyleSheet.create({
  logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: height * 0.05,
      justifyContent: 'center',
      width: '100%',
      // backgroundColor: 'red'
    },
    logo: {
      width: 27,
      height: 27,
      marginRight: 10,
    },
    appName: {
      fontSize: scale * 8,
      fontWeight: Poppins_600SemiBold,
      color: theme.colors.text,
    },
})