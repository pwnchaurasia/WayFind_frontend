import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Switch, ActivityIndicator, Modal } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/src/styles/theme'
import RideService from '@/src/apis/rideService'
import { router, useLocalSearchParams } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';

const RIDE_TYPES = [
    { value: 'One Day', label: 'Day Ride', icon: '🏍️' },
    { value: 'Multi Day', label: 'Multi-Day', icon: '🏕️' },
    { value: 'Quick Ride', label: 'Quick', icon: '⚡' },
];

const EditRide = () => {
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [ride, setRide] = useState(null);

    // Editable fields
    const [name, setName] = useState('');
    const [selectedDateTime, setSelectedDateTime] = useState(dayjs());
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
                if (r.scheduled_date) {
                    setSelectedDateTime(dayjs(r.scheduled_date));
                }
                setRideType(r.ride_type || 'One Day');
                setMaxRiders(String(r.max_riders || 30));
                setRequiresPayment(r.requires_payment || false);
                setAmount(String(r.amount || 0));

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
                name: name.trim(),
                max_riders: parseInt(maxRiders) || 30,
                requires_payment: requiresPayment,
                amount: parseFloat(amount) || 0,
                scheduled_date: selectedDateTime.toISOString(),
                ride_type: rideType,
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

    const formatDateDisplay = (date) => {
        const d = dayjs(date);
        const today = dayjs().startOf('day');
        const tomorrow = today.add(1, 'day');

        if (d.isSame(today, 'day')) return 'Today';
        if (d.isSame(tomorrow, 'day')) return 'Tomorrow';

        return d.format('ddd, MMM D');
    };

    const formatTimeDisplay = (date) => {
        return dayjs(date).format('hh:mm A');
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
                        <View style={[styles.statusBadge, {
                            backgroundColor: ride.status === 'ACTIVE' || ride.status === 'active' ? '#00C853' : '#FFB300',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingHorizontal: 10
                        }]}>
                            <Feather name={ride.status === 'ACTIVE' || ride.status === 'active' ? 'activity' : 'calendar'} size={12} color="white" />
                            <Text style={styles.statusText}>{ride.status?.toUpperCase()}</Text>
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
                                styles={theme.datePickerStyles}
                                components={{
                                    IconPrev: <Feather name="chevron-left" size={24} color={theme.colors.primary} />,
                                    IconNext: <Feather name="chevron-right" size={24} color={theme.colors.primary} />,
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
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
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
        fontSize: 16
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    datePickerModal: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        maxHeight: '85%',
    },
    datePickerContainer: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
    },
    confirmDateButton: {
        backgroundColor: theme.colors.primary,
        margin: theme.spacing.md,
        marginTop: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    confirmDateText: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
    },
});
