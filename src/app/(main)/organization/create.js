import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/src/styles/theme'
import OrganizationService from '@/src/apis/organizationService'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'

const CreateOrganization = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Organization name is required');
            return;
        }

        setLoading(true);
        try {
            const payload = { name, description };
            const response = await OrganizationService.createOrganization(payload);

            console.log("Org Created:", response);
            Alert.alert('Success', 'Organization created successfully!', [
                { text: 'OK', onPress: () => router.push('/(main)/(tabs)/organizations') }
            ]);

        } catch (error) {
            console.error('Create Org Failed:', error);
            Alert.alert('Error', error.message || 'Failed to create organization');
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Create Organization</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Royal Riders"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="What is this community about?"
                        placeholderTextColor="#666"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Create Organization</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default CreateOrganization

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30
    },
    backButton: {
        marginRight: 16
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white'
    },
    form: {
        gap: 20
    },
    inputGroup: {
        gap: 8
    },
    label: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500'
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333'
    },
    textArea: {
        height: 100
    },
    button: {
        backgroundColor: '#00C853',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20
    },
    buttonDisabled: {
        backgroundColor: '#006429',
        opacity: 0.7
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    }
})
