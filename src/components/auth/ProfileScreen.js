import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const navigation = useNavigation();

    const handleUpdate = () => {
        // Call backend API to update user details
        alert("Profile Updated!");
        navigation.navigate('LoginScreen');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Update Profile</Text>
            <TextInput 
                style={styles.input}
                placeholder="Enter Name"
                value={name}
                onChangeText={setName}
            />
            <TextInput 
                style={styles.input}
                placeholder="Enter Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                <Text style={styles.buttonText}>Update</Text>
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

export default ProfileScreen;