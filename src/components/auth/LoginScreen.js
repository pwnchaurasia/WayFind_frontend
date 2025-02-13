import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const navigation = useNavigation();

    const handleVerify = () => {
        // Call backend API to send OTP
        navigation.navigate('OtpScreen', { phoneNumber });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enter Your Mobile Number</Text>
            <TextInput 
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="Enter Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
            />
            <TouchableOpacity style={styles.button} onPress={handleVerify}>
                <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    title: { color: '#fff', fontSize: 20, marginBottom: 20 },
    input: { width: '80%', padding: 10, backgroundColor: '#222', color: '#fff', marginBottom: 20, borderRadius: 5 },
    button: { backgroundColor: 'green', padding: 15, width: '80%', alignItems: 'center', borderRadius: 5 },
    buttonText: { color: '#fff', fontSize: 16 },
});

export default LoginScreen;
