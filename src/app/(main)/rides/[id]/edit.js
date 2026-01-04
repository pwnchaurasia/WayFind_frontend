import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, ScrollView, Switch, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/src/styles/theme'
import RideService from '@/src/apis/rideService'
import { router, useLocalSearchParams } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker';

const RIDE_TYPES = [
    { value: 'One Day', label: 'Day Ride' },
    { value: 'Multi Day', label: 'Multi-Day Trip' },
    { value: 'Quick Ride', label: 'Quick Ride' },
];

const EditRide = () => {
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [ride, setRide] = useState(null);

    // Editable fields
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [rideType, setRideType] = useState('One Day');
    const [maxRiders, setMaxRiders] = useState('30');
    const [requiresPayment, setRequiresPayment] = useState(false);
    const [amount, setAmount] = useState('0');

    useEffect(() => {
        fetchRideDetails();
    }, [id]);

    const fetchRideDetails = async () => {
        try {
            setLoading(true);
            const data = await RideService.getRideById(id);

            if (data.status === 'success' && data.ride) {
                const r = data.ride;
                setRide(r);
                setName(r.name || '');
                setDate(r.scheduled_date ? new Date(r.scheduled_date) : new Date());
                setRideType(r.ride_type || 'One Day');
                setMaxRiders(String(r.max_riders || 30));
                setRequiresPayment(r.requires_payment || false);
                setAmount(String(r.amount || 0));

                // Check if ride is completed
                if (r.status === 'COMPLETED' || r.status === 'completed') {
                    Alert.alert(
                        'Cannot Edit',
                        'Completed rides cannot be edited.',
                        [{ text: 'OK', onPress: () => router.back() }]
                    );
                }
            }
        } catch (error) {
            console.error("Failed to fetch ride details", error);
            Alert.alert('Error', 'Could not load ride details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Ride name is required');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name,
                max_riders: parseInt(maxRiders) || 30,
                requires_payment: requiresPayment,
                amount: parseFloat(amount) || 0,
            };

            await RideService.updateRide(id, payload);

            Alert.alert('Success', 'Ride updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error('Update Ride Failed:', error);
            Alert.alert('Error', error.detail || error.message || 'Failed to update ride');
        } finally {
            setSaving(false);
        }
    };

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const getCheckpointLabel = (type) => {
        const labels = {
            'meetup': '🏁 Meetup Point',
            'destination': '🎯 Destination',
            'disbursement': '🏠 Disbursement',
        };
        return labels[type?.toLowerCase()] || type;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C853" />
                <Text style={styles.loadingText}>Loading ride details...</Text>
            </View>
        );
    }

    // Prevent editing completed rides
    if (ride && (ride.status === 'COMPLETED' || ride.status === 'completed')) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Feather name="lock" size={48} color="#FF5252" />
                    <Text style={styles.errorText}>Cannot Edit Completed Ride</Text>
                    <Text style={styles.errorSubtext}>Completed rides are locked and cannot be modified.</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="x" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Ride</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={styles.saveButton}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#00C853" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Status Badge */}
                {ride && (
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusBadge, { backgroundColor: ride.status === 'ACTIVE' ? '#00C853' : '#FFB300' }]}>
                            <Text style={styles.statusText}>{ride.status}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ride Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Sunday Breakfast Run"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Scheduled Date & Time</Text>
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
                    <Text style={styles.label}>Ride Type</Text>
                    <View style={styles.typeSelector}>
                        {RIDE_TYPES.map(type => (
                            <TouchableOpacity
                                key={type.value}
                                style={[styles.typeOption, rideType === type.value && styles.typeOptionActive]}
                                onPress={() => setRideType(type.value)}
                            >
                                <Text style={[styles.typeOptionText, rideType === type.value && styles.typeOptionTextActive]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Max Riders</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="30"
                        placeholderTextColor="#666"
                        value={maxRiders}
                        onChangeText={setMaxRiders}
                        keyboardType="number-pad"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.switchRow}>
                        <View>
                            <Text style={styles.label}>Paid Ride</Text>
                            <Text style={styles.sublabel}>Require payment to join</Text>
                        </View>
                        <Switch
                            value={requiresPayment}
                            onValueChange={setRequiresPayment}
                            trackColor={{ false: '#333', true: '#00C853' }}
                            thumbColor={requiresPayment ? '#fff' : '#888'}
                        />
                    </View>
                </View>

                {requiresPayment && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor="#666"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />
                    </View>
                )}

                {/* Checkpoints (Read-only display) */}
                {ride && ride.checkpoints && ride.checkpoints.length > 0 && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Checkpoints</Text>
                        <View style={styles.checkpointsList}>
                            {ride.checkpoints.map((cp, index) => (
                                <View key={cp.id || index} style={styles.checkpointItem}>
                                    <Text style={styles.checkpointLabel}>
                                        {getCheckpointLabel(cp.type)}
                                    </Text>
                                    <Text style={styles.checkpointCoords}>
                                        {cp.address || `${cp.latitude?.toFixed(4)}, ${cp.longitude?.toFixed(4)}`}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.checkpointNote}>
                            Note: Checkpoints cannot be modified after ride creation
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default EditRide;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors?.background || '#121212',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors?.background || '#121212',
        gap: 12,
    },
    loadingText: {
        color: '#888',
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    errorText: {
        color: '#FF5252',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8,
    },
    errorSubtext: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
    },
    backBtn: {
        backgroundColor: '#333',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 10,
    },
    backBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333'
    },
    backButton: {
        padding: 4
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white'
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    saveButtonText: {
        color: '#00C853',
        fontSize: 16,
        fontWeight: 'bold',
    },
    form: {
        flex: 1,
        padding: 16,
    },
    statusContainer: {
        marginBottom: 16,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: 'black',
        fontSize: 12,
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: 20
    },
    label: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8
    },
    sublabel: {
        color: '#888',
        fontSize: 12,
        marginTop: 2
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        padding: 14,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333'
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#333'
    },
    dateText: {
        color: 'white',
        fontSize: 16
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 10,
    },
    typeOption: {
        flex: 1,
        backgroundColor: '#1E1E1E',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    typeOptionActive: {
        backgroundColor: '#00C853',
        borderColor: '#00C853'
    },
    typeOptionText: {
        color: '#888',
        fontSize: 13,
        fontWeight: '500'
    },
    typeOptionTextActive: {
        color: 'white'
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    checkpointsList: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        overflow: 'hidden',
    },
    checkpointItem: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    checkpointLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    checkpointCoords: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
    },
    checkpointNote: {
        color: '#666',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 8,
    },
});
