import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { globalStyles } from '@/src/styles/globalStyles';
import { theme } from '@/src/styles/theme';

const LoadingScreen = () => {
  return (
    <View style={[globalStyles.container, globalStyles.flexCenter]}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>WayFind</Text>
      </View>
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary} 
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl + theme.spacing.md,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.lg,
  },
  appName: {
    fontSize: theme.fontSize.huge,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
});

export default LoadingScreen;
