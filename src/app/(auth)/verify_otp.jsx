import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StatusBar, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/src/styles/theme';
import LogoSection from '@/src/components/LogoSection';
import imagePath from '../../constants/imagePath';
import { Link } from 'expo-router';

const { width, height } = Dimensions.get('window');

const VerifyOtp = () => {
  const [timer, setTimer] = useState(263); // 4:23 in seconds
  const [code, setCode] = useState(['', '', '', '', '', '']); // Changed to empty initial state
  const inputRefs = useRef([]);
  const scrollViewRef = useRef(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Setup timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      const keyboardHeight = event.endCoordinates.height;
      
      Animated.timing(animatedValue, {
        toValue: -keyboardHeight * 0.2, // Move up by 20% of keyboard height
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Format timer as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle code input
  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    
    // Handle single digit input
    if (text.length <= 1) {
      newCode[index] = text;
      setCode(newCode);
      
      // Auto-focus next input if text is entered and not the last input
      if (text && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handle backspace - move to previous input
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateY: animatedValue }]
          }
        ]}
      >
          {/* Logo Section */}
          <LogoSection />
          
          {/* Middle Content */}
          <View style={styles.contentContainer}>
            <Image 
              source={imagePath.mailbox} 
              style={styles.illustration}
              resizeMode="contain"
            />
            
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              Please Enter Code that we Send you{'\n'}to your Phone.
            </Text>
            
            {/* Code Input */}
            <View style={styles.codeContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput, 
                    code[index] ? styles.filledInput : {},
                  ]}
                  value={code[index]}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectionColor="#00C853"
                />
              ))}
            </View>
            
            {/* Resend Timer */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Resend in <Text style={styles.timerText}>{formatTime(timer)}</Text>
              </Text>
            </View>
            
            {/* Call Option */}
            <TouchableOpacity style={styles.callOption}>
              <Text style={styles.callOptionText}>Get Verification Code By Call</Text>
            </TouchableOpacity>
          </View>
          
          {/* Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button}>
              <Link href="/update_profile" style={styles.buttonText}> Verify Code</Link>
            </TouchableOpacity>
          </View>
          
          {/* Footer */}
          <Text style={styles.footer}>Made with love in India by rjsnh1522</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

export default VerifyOtp

const styles = StyleSheet.create({
  // Animated container for smooth keyboard handling
  animatedContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: width * 0.05,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: height * 0.02,
    width: '100%',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  appName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.05, // Add space between logo and content
  },
  illustration: {
    width: width * 0.3,
    height: width * 0.3,
    marginBottom: height * 0.05,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 10,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: height * 0.04,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
  },
  codeInput: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.input_box,
    borderRadius: 5,
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    textAlignVertical: 'center', // This centers text vertically on Android
    fontWeight: 'bold',
    lineHeight: 20, // This helps center text vertically on iOS (matches height)
  },
  filledInput: {
    borderWidth: 1,
    borderColor: '#00C853',
  },
  activeInput: {
    borderWidth: 1,
    borderColor: '#00C853',
  },
  resendContainer: {
    marginTop: height * 0.04,
  },
  resendText: {
    color: 'white',
    fontSize: 16,
  },
  timerText: {
    textDecorationLine: 'underline',
  },
  callOption: {
    marginTop: height * 0.02,
  },
  callOptionText: {
    color: '#00C853',
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  button: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00C853',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    width: '80%',
  },
  buttonText: {
    color: '#00C853',
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
});
