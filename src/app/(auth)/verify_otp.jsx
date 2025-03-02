import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StatusBar, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  TextInput
} from 'react-native';

import { theme } from '@/src/styles/theme';
import LogoSection from '@/src/components/LogoSection';
import imagePath from '../../constants/imagePath';
import { Link } from 'expo-router';



const { width, height } = Dimensions.get('window');

const VerifyOtp = () => {
  const [timer, setTimer] = useState(263); // 4:23 in seconds
  const [code, setCode] = useState(['2', '4', '8', '']);
  const inputRefs = useRef([]);

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

  // Format timer as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle code input
  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    
    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
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
                index === 2 ? styles.activeInput : {}
              ]}
              value={code[index]}
              onChangeText={(text) => handleCodeChange(text, index)}
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
          {/* <Text style={styles.buttonText}>Verify Code</Text> */}
          <Link href="/update_profile" style={styles.buttonText}> Verify Code</Link>
        </TouchableOpacity>
      </View>
      
      {/* Footer */}
      <Text style={styles.footer}>Made in India by rjsnh1522</Text>
    </SafeAreaView>
  );
}

export default VerifyOtp

const styles = StyleSheet.create({
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
    fontWeight: 'bold',
  },
  filledInput: {
    borderWidth: 0,
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
    marginBottom: height * 0.05,
    alignItems: 'center',
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