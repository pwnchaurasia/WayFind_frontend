import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const OtpScreen = () => {
    const [otp, setOtp] = useState('');
    const navigation = useNavigation();
    const route = useRoute();
    const { phoneNumber } = route.params;

    const handleOtpSubmit = () => {
        // Call backend API to verify OTP
        navigation.navigate('ProfileScreen', { phoneNumber });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enter OTP Sent to {phoneNumber}</Text>
            <TextInput 
                style={styles.input}
                keyboardType="numeric"
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
            />
            <TouchableOpacity style={styles.button} onPress={handleOtpSubmit}>
                <Text style={styles.buttonText}>Verify OTP</Text>
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

export default OtpScreen;
