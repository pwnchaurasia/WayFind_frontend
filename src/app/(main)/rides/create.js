import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Switch, Modal } from 'react-native'
import React, { useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/src/styles/theme'
import RideService from '@/src/apis/rideService'
import { router, useLocalSearchParams } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import MapSelector from '@/src/components/map/MapSelector';

const RIDE_TYPES = [
    { value: 'One Day', label: 'Day Ride', icon: '🏍️' },
    { value: 'Multi Day', label: 'Multi-Day', icon: '🏕️' },
    { value: 'Quick Ride', label: 'Quick', icon: '⚡' },
];

// Time slots removed - now using unified date-time picker

const CreateRide = () => {
    const { orgId } = useLocalSearchParams();

    // Ride details
    const [name, setName] = useState('');
    // Initialize with today at 8:00 AM
    const [selectedDateTime, setSelectedDateTime] = useState(dayjs().hour(8).minute(0).second(0));
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [rideType, setRideType] = useState('One Day');
    const [maxRiders, setMaxRiders] = useState('30');
    const [requiresPayment, setRequiresPayment] = useState(false);
    const [amount, setAmount] = useState('0');

    // All checkpoints from map
    const [checkpoints, setCheckpoints] = useState({
        start: null,
        destination: null,
        end: null,
    });

    const [loading, setLoading] = useState(false);

    // Handle locations from MapSelector
    const handleLocationsChange = useCallback((locations) => {
        setCheckpoints(locations);
    }, []);

    // Count set checkpoints
    const checkpointCount = Object.values(checkpoints).filter(cp => cp !== null).length;

    // Format date for display
    const formatDateDisplay = (date) => {
        const d = dayjs(date);
        const today = dayjs().startOf('day');
        const tomorrow = today.add(1, 'day');

        if (d.isSame(today, 'day')) return 'Today';
        if (d.isSame(tomorrow, 'day')) return 'Tomorrow';

        return d.format('ddd, MMM D');
    };

    // Format time for display
    const formatTimeDisplay = (date) => {
        return dayjs(date).format('hh:mm A');
    };

    const handleCreate = async () => {
        // Validation
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a ride name');
            return;
        }
        if (!checkpoints.start) {
            Alert.alert('Error', 'Please set a Start point on the map');
            return;
        }
        if (!checkpoints.destination) {
            Alert.alert('Error', 'Please set a Destination on the map');
            return;
        }

        setLoading(true);
        try {
            // Build checkpoints array for API
            const checkpointsArray = [];

            if (checkpoints.start) {
                checkpointsArray.push({
                    type: 'meetup',
                    latitude: checkpoints.start.latitude,
                    longitude: checkpoints.start.longitude,
                });
            }
            if (checkpoints.destination) {
                checkpointsArray.push({
                    type: 'destination',
                    latitude: checkpoints.destination.latitude,
                    longitude: checkpoints.destination.longitude,
                });
            }
            if (checkpoints.end) {
                checkpointsArray.push({
                    type: 'disbursement',
                    latitude: checkpoints.end.latitude,
                    longitude: checkpoints.end.longitude,
                });
            }

            const payload = {
                name: name.trim(),
                organization_id: orgId,
                max_riders: parseInt(maxRiders) || 30,
                requires_payment: requiresPayment,
                amount: parseFloat(amount) || 0,
                checkpoints: checkpointsArray
            };

            console.log('Creating ride with payload:', payload);

            const response = await RideService.createRide(payload);
            console.log("Ride Created:", response);

            Alert.alert('Success! 🎉', 'Your ride has been created.', [
                { text: 'View Rides', onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error('Create Ride Failed:', error);
            Alert.alert('Error', error.detail || error.message || 'Failed to create ride');
        } finally {
            setLoading(false);
        }
    };



    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="x" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Create Ride</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Ride Name */}
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

                {/* Date & Time Row */}
                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.dateText}>{formatDateDisplay(selectedDateTime)}</Text>
                            <Feather name="calendar" size={18} color="#00C853" />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Time</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.dateText}>{formatTimeDisplay(selectedDateTime)}</Text>
                            <Feather name="clock" size={18} color="#00C853" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Max Riders */}
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

                {/* Ride Type */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ride Type</Text>
                    <View style={styles.typeContainer}>
                        {RIDE_TYPES.map(type => (
                            <TouchableOpacity
                                key={type.value}
                                style={[styles.typeButton, rideType === type.value && styles.typeButtonActive]}
                                onPress={() => setRideType(type.value)}
                            >
                                <Text style={styles.typeIcon}>{type.icon}</Text>
                                <Text style={[styles.typeLabel, rideType === type.value && styles.typeLabelActive]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Payment Toggle */}
                <View style={styles.paymentRow}>
                    <View>
                        <Text style={styles.label}>Paid Ride</Text>
                        <Text style={styles.sublabel}>Require payment to join</Text>
                    </View>
                    <Switch
                        value={requiresPayment}
                        onValueChange={setRequiresPayment}
                        trackColor={{ false: '#333', true: '#00C853' }}
                        thumbColor="white"
                    />
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

                {/* Map Section */}
                <View style={styles.mapSection}>
                    <View style={styles.mapHeader}>
                        <Text style={styles.sectionTitle}>📍 Set Route Checkpoints</Text>
                        <Text style={styles.checkpointCount}>{checkpointCount}/3 set</Text>
                    </View>
                    <Text style={styles.mapHint}>
                        Tap buttons to switch marker type, then tap map to place
                    </Text>

                    <MapSelector
                        onLocationsSelect={handleLocationsChange}
                        singleMarkerMode={false}
                    />

                    {/* Checkpoint Status */}
                    <View style={styles.checkpointStatus}>
                        <View style={[styles.statusItem, checkpoints.start && styles.statusItemComplete]}>
                            <Text style={styles.statusIcon}>🏁</Text>
                            <Text style={styles.statusText}>Start</Text>
                            {checkpoints.start ? (
                                <Feather name="check-circle" size={16} color="#22c55e" />
                            ) : (
                                <Feather name="circle" size={16} color="#666" />
                            )}
                        </View>
                        <View style={[styles.statusItem, checkpoints.destination && styles.statusItemComplete]}>
                            <Text style={styles.statusIcon}>🎯</Text>
                            <Text style={styles.statusText}>Dest</Text>
                            {checkpoints.destination ? (
                                <Feather name="check-circle" size={16} color="#ef4444" />
                            ) : (
                                <Feather name="circle" size={16} color="#666" />
                            )}
                        </View>
                        <View style={[styles.statusItem, checkpoints.end && styles.statusItemComplete]}>
                            <Text style={styles.statusIcon}>🏠</Text>
                            <Text style={styles.statusText}>End</Text>
                            {checkpoints.end ? (
                                <Feather name="check-circle" size={16} color="#f97316" />
                            ) : (
                                <Text style={styles.optionalText}>(opt)</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Create Button */}
                <TouchableOpacity
                    style={[styles.createButton, loading && styles.buttonDisabled]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <Text style={styles.createButtonText}>Creating...</Text>
                    ) : (
                        <>
                            <Feather name="plus-circle" size={20} color="white" />
                            <Text style={styles.createButtonText}>Create Ride</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Date & Time Picker Modal */}
            <Modal visible={showDatePicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.datePickerModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Date & Time</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Feather name="x" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.datePickerContainer}>
                            <DateTimePicker
                                mode="single"
                                date={selectedDateTime}
                                onChange={(params) => {
                                    if (params.date) {
                                        setSelectedDateTime(dayjs(params.date));
                                    }
                                }}
                                timePicker={true}
                                minDate={dayjs().startOf('day')}
                                styles={{
                                    // Days grid
                                    days: { backgroundColor: '#1C1C23' },
                                    day: { backgroundColor: 'transparent' },
                                    day_cell: { backgroundColor: 'transparent' },
                                    day_label: { color: '#FFFFFF' },
                                    // Header
                                    header: { backgroundColor: '#1C1C23' },
                                    month_selector: { backgroundColor: 'transparent' },
                                    month_selector_label: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
                                    year_selector: { backgroundColor: 'transparent' },
                                    year_selector_label: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
                                    time_selector: { backgroundColor: '#2A2A2A', borderRadius: 8 },
                                    time_selector_label: { color: '#FFFFFF' },
                                    // Weekdays
                                    weekdays: { backgroundColor: '#1C1C23' },
                                    weekday: { backgroundColor: 'transparent' },
                                    weekday_label: { color: '#9E9E9E' },
                                    // Today
                                    today: { borderColor: '#00C851', borderWidth: 1, borderRadius: 20 },
                                    today_label: { color: '#00C851' },
                                    // Selected
                                    selected: { backgroundColor: '#00C851', borderRadius: 20 },
                                    selected_label: { color: '#FFFFFF', fontWeight: 'bold' },
                                    // Months grid
                                    months: { backgroundColor: '#1C1C23' },
                                    month: { backgroundColor: 'transparent' },
                                    month_label: { color: '#FFFFFF' },
                                    selected_month: { backgroundColor: '#00C851', borderRadius: 8 },
                                    selected_month_label: { color: '#FFFFFF', fontWeight: 'bold' },
                                    // Years grid
                                    years: { backgroundColor: '#1C1C23' },
                                    year: { backgroundColor: 'transparent' },
                                    year_label: { color: '#FFFFFF' },
                                    selected_year: { backgroundColor: '#00C851', borderRadius: 8 },
                                    selected_year_label: { color: '#FFFFFF', fontWeight: 'bold' },
                                    active_year: { backgroundColor: 'transparent', borderColor: '#00C851', borderWidth: 1, borderRadius: 8 },
                                    active_year_label: { color: '#00C851' },
                                    // Time picker
                                    time_label: { color: '#FFFFFF' },
                                    time_selected_indicator: { backgroundColor: 'rgba(0, 200, 81, 0.2)' },
                                    // Outside days
                                    outside: { backgroundColor: 'transparent' },
                                    outside_label: { color: '#666666' },
                                    // Disabled
                                    disabled: { backgroundColor: 'transparent' },
                                    disabled_label: { color: '#444444' },
                                    // Navigation buttons
                                    button_prev: { backgroundColor: 'transparent' },
                                    button_next: { backgroundColor: 'transparent' },
                                }}
                                components={{
                                    IconPrev: <Feather name="chevron-left" size={24} color="#00C851" />,
                                    IconNext: <Feather name="chevron-right" size={24} color="#00C851" />,
                                }}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.confirmDateButton}
                            onPress={() => setShowDatePicker(false)}
                        >
                            <Text style={styles.confirmDateText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default CreateRide

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors?.background || '#121212',
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
    content: {
        flex: 1,
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16
    },
    label: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8
    },
    sublabel: {
        color: '#888',
        fontSize: 12,
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
    row: {
        flexDirection: 'row',
        gap: 12,
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
        fontSize: 14
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#333'
    },
    typeButtonActive: {
        borderColor: '#00C853',
        backgroundColor: '#0a2a1a'
    },
    typeIcon: {
        fontSize: 20,
        marginBottom: 4
    },
    typeLabel: {
        color: '#888',
        fontSize: 12,
        fontWeight: '500'
    },
    typeLabelActive: {
        color: '#00C853'
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 14,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333'
    },
    mapSection: {
        marginBottom: 20
    },
    mapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    checkpointCount: {
        color: '#00C853',
        fontSize: 13,
        fontWeight: '600'
    },
    mapHint: {
        color: '#888',
        fontSize: 12,
        marginBottom: 12
    },
    checkpointStatus: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8
    },
    statusItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 10,
        borderRadius: 8,
        gap: 6
    },
    statusItemComplete: {
        backgroundColor: '#1a2a1a'
    },
    statusIcon: {
        fontSize: 14
    },
    statusText: {
        flex: 1,
        color: '#CCC',
        fontSize: 11,
        fontWeight: '500'
    },
    optionalText: {
        color: '#666',
        fontSize: 9
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: '#00C853',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 8
    },
    buttonDisabled: {
        backgroundColor: '#006429',
        opacity: 0.7
    },
    createButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    datePickerModal: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        overflow: 'hidden',
        maxHeight: '85%',
    },
    datePickerContainer: {
        padding: 16,
        backgroundColor: '#1E1E1E',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    confirmDateButton: {
        backgroundColor: '#00C853',
        margin: 16,
        marginTop: 8,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmDateText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
