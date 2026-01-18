import React, { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/styles/theme';
import { Feather } from '@expo/vector-icons';
import LogoSection from '@/src/components/LogoSection';
import { Link, router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const TermsAndAgreement = () => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const handleContinue = () => {
    if (agreedToTerms && agreedToPrivacy) {
      router.push("/login");
    }
  };

  const isButtonEnabled = agreedToTerms && agreedToPrivacy;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.animatedContainer}>
        {/* Logo Section */}
        <LogoSection />

        {/* Middle Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Terms & Privacy</Text>
          <Text style={styles.subtitle}>
            Please read and accept our terms{'\n'}and privacy policy to continue.
          </Text>

          {/* Terms Content */}
          <ScrollView
            style={styles.termsScrollView}
            contentContainerStyle={styles.termsContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.termsTitle}>Terms of Service</Text>
            <Text style={styles.termsText}>
              By using Squadra, you agree to our terms of service. This app helps you find and share locations with your friends and family. We are committed to providing a safe and reliable service.
            </Text>

            <Text style={styles.termsTitle}>Privacy Policy</Text>
            <Text style={styles.termsText}>
              Your privacy is important to us. We collect location data only when you explicitly share it. Your personal information is encrypted and stored securely. We do not sell your data to third parties.
            </Text>

            <Text style={styles.termsTitle}>Data Usage</Text>
            <Text style={styles.termsText}>
              Location data is used solely for the purpose of sharing your location with selected contacts. You can control who sees your location and can stop sharing at any time.
            </Text>
          </ScrollView>

          {/* Agreement Checkboxes */}
          <View style={styles.agreementContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkedBox]}>
                {agreedToTerms && <Feather name="check" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxText}>I agree to the Terms of Service</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
            >
              <View style={[styles.checkbox, agreedToPrivacy && styles.checkedBox]}>
                {agreedToPrivacy && <Feather name="check" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxText}>I agree to the Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isButtonEnabled && styles.buttonEnabled]}
            onPress={handleContinue}
            disabled={!isButtonEnabled}
          >
            <Text style={[styles.buttonText, isButtonEnabled && styles.buttonTextEnabled]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Made with love in India by rjsnh1522</Text>
      </View>
    </SafeAreaView>
  );
}

export default TermsAndAgreement;

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: width * 0.05,
  },

  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: height * 0.03,
    paddingHorizontal: width * 0.05,
  },

  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },

  subtitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: height * 0.04,
  },

  termsScrollView: {
    width: '100%',
    maxHeight: height * 0.4,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    marginBottom: height * 0.03,
  },

  termsContent: {
    padding: 20,
  },

  termsTitle: {
    color: '#00C853',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 15,
  },

  termsText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },

  agreementContainer: {
    width: '100%',
    marginBottom: height * 0.02,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#666',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkedBox: {
    backgroundColor: '#00C853',
    borderColor: '#00C853',
  },

  checkboxText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },

  buttonContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: width * 0.05,
  },

  button: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    width: '80%',
  },

  buttonEnabled: {
    borderColor: '#00C853',
  },

  buttonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '500',
  },

  buttonTextEnabled: {
    color: '#00C853',
  },

  footer: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
});
