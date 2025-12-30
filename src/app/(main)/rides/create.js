import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/src/styles/theme'
import RideService from '@/src/apis/rideService'
import { router, useLocalSearchParams } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker';
import MapSelector from '@/src/components/map/MapSelector';

const CreateRide = () => {
    const { orgId } = useLocalSearchParams();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // Checkpoint States
    const [meetup, setMeetup] = useState(null);
    const [destination, setDestination] = useState(null);
    const [checkpoints, setCheckpoints] = useState([]);

    const addCheckpoint = () => {
        setCheckpoints([...checkpoints, { latitude: 0, longitude: 0 }]); // Placeholder, map will update
    };

    const updateCheckpoint = (index, coords) => {
        const newCheckpoints = [...checkpoints];
        newCheckpoints[index] = coords;
        setCheckpoints(newCheckpoints);
    };

    const removeCheckpoint = (index) => {
        const newCheckpoints = checkpoints.filter((_, i) => i !== index);
        setCheckpoints(newCheckpoints);
    }

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Ride name is required');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name,
                description,
                start_time: date.toISOString(),
                organization_id: orgId,
                checkpoints: [
                    { type: 'meetup', ...meetup },
                    { type: 'destination', ...destination },
                    ...checkpoints.map(cp => ({ type: 'refreshment', ...cp })) // Default to refreshment for intermediate
                ].filter(cp => cp.latitude && cp.longitude) // Filter valid
            };
            const response = await RideService.createRide(payload);

            console.log("Ride Created:", response);
            Alert.alert('Success', 'Ride created successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error('Create Ride Failed:', error);
            Alert.alert('Error', error.message || 'Failed to create ride');
        } finally {
            setLoading(false);
        }
    }

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Create New Ride</Text>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ride Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Sunday Breakfast Run"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Start Date & Time</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateText}>{date.toLocaleString()}</Text>
                        <Feather name="calendar" size={20} color="#00C853" />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="datetime"
                            display="default"
                            onChange={onChangeDate}
                            themeVariant="dark"
                        />
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Route details, meeting point, etc."
                        placeholderTextColor="#666"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Starting Point (Meetup)</Text>
                    <MapSelector
                        onLocationSelect={(coords) => {
                            setMeetup(coords);
                        }}
                        initialRegion={null}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Destination</Text>
                    <MapSelector
                        onLocationSelect={(coords) => {
                            setDestination(coords);
                        }}
                    />
                </View>

                {/* Intermediate Checkpoints */}
                <View style={styles.inputGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.label}>Checkpoints (Optional)</Text>
                        <TouchableOpacity onPress={addCheckpoint} style={styles.addBtn}>
                            <Feather name="plus" size={20} color="#00C853" />
                        </TouchableOpacity>
                    </View>

                    {checkpoints.map((cp, index) => (
                        <View key={index} style={styles.checkpointItem}>
                            <Text style={{ color: '#CCC', marginBottom: 5 }}>Checkpoint #{index + 1}</Text>
                            <MapSelector
                                onLocationSelect={(coords) => {
                                    updateCheckpoint(index, coords);
                                }}
                            />
                            <TouchableOpacity
                                style={styles.removeBtn}
                                onPress={() => removeCheckpoint(index)}
                            >
                                <Text style={{ color: '#FF4444' }}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Schedule Ride'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

export default CreateRide

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333'
    },
    backButton: {
        marginRight: 16
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white'
    },
    form: {
        padding: 20,
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
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#333'
    },
    dateText: {
        color: 'white',
        fontSize: 16
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
    },
    addBtn: {
        padding: 5
    },
    checkpointItem: {
        marginBottom: 15,
        backgroundColor: '#252525',
        padding: 10,
        borderRadius: 8
    },
    removeBtn: {
        marginTop: 5,
        alignSelf: 'flex-end'
    }
})
