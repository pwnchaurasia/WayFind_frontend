import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { globalStyles } from '@/src/styles/globalStyles';
import { theme } from '@/src/styles/theme';

import LogoSvg from '@/src/assets/images/logo-svg.svg';

const LoadingScreen = () => {
  return (
    <View style={[globalStyles.container, globalStyles.flexCenter]}>
      <View style={styles.logoContainer}>
        <LogoSvg
          width={120}
          height={120}
          style={styles.logo}
        />
        <Text style={styles.appName}>Squadra</Text>
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
