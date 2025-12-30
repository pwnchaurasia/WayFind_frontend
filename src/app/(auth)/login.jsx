import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'
import imagePath from '@/src/constants/imagePath'
import { theme } from '@/src/styles/theme';
import { router } from 'expo-router';
import LogoSection from '@/src/components/LogoSection';
import { GoogleSignin, statusCodes } from '@/src/utils/googleSignin';
import AuthService from '@/src/apis/authService';
import { useAuth } from '@/src/context/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Assuming useAuth has a login function that takes userData/token

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Placeholder for user to fill
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = userInfo; // or userInfo.idToken for older versions

      console.log("Google User Info:", userInfo);

      if (idToken) {
        const response = await AuthService.googleLogin(idToken);
        console.log("Backend Google Login Success:", response);

        if (response.data && response.data.token) {
          await login(response.data.token, response.data.user);
          router.replace('/(main)/(tabs)/organizations');
        }
      } else {
        // Mock Flow if no client ID set
        Alert.alert("Dev Mode", "Google ID Token missing (Check Configuration). Using Mock Login for testing?");
        // In real app, remove this mock
      }

    } catch (error) {
      console.error("Google Sign-In Error", error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        Alert.alert("Error", "Google Play Services not available");
      } else {
        // some other error happened
        Alert.alert("Login Failed", "Could not sign in with Google. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = () => {
    // Navigate to legacy phone login or show modal
    Alert.alert("Info", "Phone login is currently disabled in favor of Google Sign-In.");
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.content}>
        <LogoSection />

        <View style={styles.illustrationContainer}>
          <Image
            source={imagePath.paper_plane}
            style={styles.illustration}
            resizeMode='contain'
          />
        </View>

        <View style={styles.textSection}>
          <Text style={styles.title}>Welcome to WayFind</Text>
          <Text style={styles.subtitle}>
            Join the community of riders. Plan, ride, and explore together.
          </Text>
        </View>

        <View style={styles.authSection}>
          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="black" />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.phoneButton} onPress={handlePhoneLogin}>
            <Text style={styles.phoneButtonText}>Continue with Phone Number</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>By continuing, you agree to our Terms & Privacy Policy.</Text>
    </SafeAreaView>
  )
}

export default LoginPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    paddingBottom: 20
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  illustrationContainer: {
    marginTop: height * 0.05,
    marginBottom: height * 0.03,
  },
  illustration: {
    width: width * 0.4,
    height: width * 0.4,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20
  },
  authSection: {
    width: '100%',
    gap: 16
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    gap: 12
  },
  googleIcon: {
    width: 24,
    height: 24
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333'
  },
  orText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 12
  },
  phoneButton: {
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center'
  },
  phoneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 30
  }
})
