import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share, Image, Modal, Pressable, Linking, TextInput } from 'react-native'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import RideService from '@/src/apis/rideService'
import UserService from '@/src/apis/userService'
import { useAuth } from '@/src/context/AuthContext'
import { theme } from '@/src/styles/theme'

const RideDetails = () => {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    // Vehicle selection for joining/updating
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [vehicleMode, setVehicleMode] = useState('join'); // 'join' or 'update'
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: '', license_plate: '' });
    const [addingVehicle, setAddingVehicle] = useState(false);
    const [updatingVehicle, setUpdatingVehicle] = useState(false);

    // Admin action modal
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Participant filters
    const [participantFilter, setParticipantFilter] = useState('all'); // all, paid, unpaid, banned
    const [sortAZ, setSortAZ] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    const fetchRideDetails = async () => {
        try {
            setLoading(true);
            const data = await RideService.getRideById(id);
            if (data.status === 'success' && data.ride) {
                setRide(data.ride);
            }
        } catch (error) {
            console.error("Failed to fetch ride details", error);
            // Show specific error if available to debug "Organization not found" reports
            Alert.alert('Error', error.detail || error.message || 'Could not load ride details');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (id) fetchRideDetails();
    }, [id]);

    // Filtered and sorted participants
    const filteredParticipants = useMemo(() => {
        if (!ride?.participants) return [];

        let result = [...ride.participants];

        // Apply filter
        switch (participantFilter) {
            case 'paid':
                result = result.filter(p => p.has_paid);
                break;
            case 'unpaid':
                result = result.filter(p => !p.has_paid && p.role !== 'banned');
                break;
            case 'banned':
                result = result.filter(p => p.role === 'banned');
                break;
            case 'present':
                result = result.filter(p => p.attendance_status === 'present');
                break;
            case 'absent':
                result = result.filter(p => p.attendance_status === 'absent' || !p.attendance_status);
                break;
        }

        // Apply sort
        if (sortAZ) {
            result.sort((a, b) => {
                const nameA = (a.user?.name || '').toLowerCase();
                const nameB = (b.user?.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
        }

        return result;
    }, [ride?.participants, participantFilter, sortAZ]);

    // ============================================
    // VEHICLE SELECTION FOR JOINING
    // ============================================

    const fetchVehicles = async () => {
        setLoadingVehicles(true);
        try {
            const data = await UserService.getUserVehicles();
            setVehicles(data.vehicles || []);
            // Auto-select primary or first vehicle
            if (data.vehicles?.length > 0) {
                const primary = data.vehicles.find(v => v.is_primary);
                setSelectedVehicle(primary || data.vehicles[0]);
            }
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
        } finally {
            setLoadingVehicles(false);
        }
    };

    const handleJoinPress = async () => {
        // First, fetch user's vehicles and show selection modal
        setVehicleMode('join');
        await fetchVehicles();
        setShowVehicleModal(true);
    };

    const handleChangeVehiclePress = async () => {
        // For existing participants to change their vehicle
        setVehicleMode('update');
        await fetchVehicles();

        // Pre-select current vehicle if exists
        if (ride?.my_vehicle) {
            const currentVehicle = vehicles.find(v => v.id === ride.my_vehicle.id);
            if (currentVehicle) {
                setSelectedVehicle(currentVehicle);
            }
        }

        setShowVehicleModal(true);
    };

    const handleAddVehicle = async () => {
        if (!newVehicle.make.trim() || !newVehicle.model.trim()) {
            Alert.alert('Error', 'Make and Model are required');
            return;
        }

        setAddingVehicle(true);
        try {
            const vehicleData = {
                make: newVehicle.make.trim(),
                model: newVehicle.model.trim(),
                year: newVehicle.year ? parseInt(newVehicle.year) : null,
                license_plate: newVehicle.license_plate.trim() || null,
                is_primary: vehicles.length === 0, // First vehicle is primary
            };

            const result = await UserService.addVehicle(vehicleData);

            // Refresh vehicles and select the new one
            await fetchVehicles();
            if (result.vehicle) {
                setSelectedVehicle(result.vehicle);
            }

            // Reset form
            setNewVehicle({ make: '', model: '', year: '', license_plate: '' });
            setShowAddVehicle(false);

            Alert.alert('Success', 'Vehicle added successfully!');
        } catch (error) {
            Alert.alert('Error', error.detail || 'Failed to add vehicle');
        } finally {
            setAddingVehicle(false);
        }
    };

    const handleVehicleConfirm = async () => {
        if (!selectedVehicle) {
            Alert.alert('Select Vehicle', 'Please select a vehicle or add a new one');
            return;
        }

        setShowVehicleModal(false);

        if (vehicleMode === 'join') {
            // Joining a new ride
            setJoining(true);
            try {
                await RideService.joinRide(id, { vehicle_info_id: selectedVehicle.id });
                Alert.alert('Success', 'You have joined the ride!');
                fetchRideDetails();
            } catch (error) {
                if (error.detail?.includes('banned')) {
                    Alert.alert(
                        'Access Denied',
                        'You are banned from this ride. Please contact the admin.',
                        [{ text: 'OK' }]
                    );
                } else {
                    Alert.alert('Error', error.detail || error.message || 'Failed to join ride');
                }
            } finally {
                setJoining(false);
            }
        } else {
            // Updating vehicle for existing participation
            setUpdatingVehicle(true);
            try {
                await RideService.updateMyVehicle(id, selectedVehicle.id);
                Alert.alert('Success', 'Vehicle updated successfully!');
                fetchRideDetails();
            } catch (error) {
                Alert.alert('Error', error.detail || error.message || 'Failed to update vehicle');
            } finally {
                setUpdatingVehicle(false);
            }
        }
    };

    // Status Management
    const handleStartRide = async () => {
        Alert.alert(
            "Start Ride",
            "Are you sure you want to start this ride? participants will be notified.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Start Ride",
                    onPress: async () => {
                        setStatusLoading(true);
                        try {
                            await RideService.startRide(id);
                            fetchRideDetails();
                            Alert.alert("Success", "Ride has started! Safe riding!");
                        } catch (error) {
                            Alert.alert("Error", error.message || "Failed to start ride");
                        } finally {
                            setStatusLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleEndRide = async () => {
        Alert.alert(
            "End Ride",
            "Are you sure you want to end this ride? This will mark it as completed.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "End Ride",
                    style: 'destructive',
                    onPress: async () => {
                        setStatusLoading(true);
                        try {
                            await RideService.endRide(id);
                            fetchRideDetails();
                            Alert.alert("Success", "Ride completed!");
                        } catch (error) {
                            Alert.alert("Error", error.message || "Failed to end ride");
                        } finally {
                            setStatusLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        if (!ride) return;
        try {
            const joinUrl = `squadra://rides/${id}`;
            await Share.share({
                message: `Join me on "${ride.name}" ride with ${ride.organization?.name}!\n\n${joinUrl}`,
                title: `Join ${ride.name}`
            });
        } catch (error) {
            console.error(error);
        }
    }

    const handleCopyLink = async () => {
        const joinUrl = `squadra://rides/${id}`;
        await Clipboard.setStringAsync(joinUrl);
        Alert.alert('Copied!', 'Ride link copied to clipboard');
    }

    // ============================================
    // ADMIN ACTIONS
    // ============================================

    const openParticipantActions = (participant) => {
        if (!ride.is_admin) return;
        setSelectedParticipant(participant);
        setShowActionModal(true);
    };

    const handleCall = () => {
        if (selectedParticipant?.user?.phone_number) {
            Linking.openURL(`tel:${selectedParticipant.user.phone_number}`);
        }
    };

    const handleMarkPayment = async () => {
        if (!selectedParticipant) return;
        setActionLoading(true);
        try {
            await RideService.markPayment(id, selectedParticipant.id, ride.amount || 0);
            Alert.alert('Success', 'Payment status updated');
            setShowActionModal(false);
            fetchRideDetails();
        } catch (error) {
            Alert.alert('Error', error.detail || 'Failed to update payment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkAttendance = async (status) => {
        if (!selectedParticipant) return;
        setActionLoading(true);
        try {
            await RideService.markAttendance(id, selectedParticipant.id, status);
            Alert.alert('Success', `Marked as ${status}`);
            setShowActionModal(false);
            fetchRideDetails();
        } catch (error) {
            Alert.alert('Error', error.detail || 'Failed to mark attendance');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveParticipant = async () => {
        if (!selectedParticipant) return;

        Alert.alert(
            'Remove Participant',
            `Are you sure you want to remove ${selectedParticipant.user?.name || 'this participant'} from the ride?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await RideService.removeParticipant(id, selectedParticipant.id);
                            Alert.alert('Success', 'Participant removed');
                            setShowActionModal(false);
                            fetchRideDetails();
                        } catch (error) {
                            Alert.alert('Error', error.detail || 'Failed to remove participant');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleToggleBan = async () => {
        if (!selectedParticipant) return;
        const isBanned = selectedParticipant.role === 'banned';

        setActionLoading(true);
        try {
            await RideService.toggleBan(id, selectedParticipant.id);
            Alert.alert('Success', isBanned ? 'Participant unbanned' : 'Participant banned');
            setShowActionModal(false);
            fetchRideDetails();
        } catch (error) {
            Alert.alert('Error', error.detail || 'Failed to update ban status');
        } finally {
            setActionLoading(false);
        }
    };

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    const getStatusColor = (status) => {
        const colors = {
            'PLANNED': '#2962FF',
            'planned': '#2962FF',
            'ACTIVE': theme.colors.primary,
            'active': theme.colors.primary,
            'COMPLETED': '#888',
            'completed': '#888',
            'CANCELLED': '#FF5252',
            'cancelled': '#FF5252'
        };
        return colors[status] || '#888';
    }

    const getRideTypeLabel = (type) => {
        const types = {
            'ONE_DAY': 'Day Ride',
            'MULTI_DAY': 'Multi-Day',
            'WEEKEND': 'Weekend Trip'
        };
        return types[type] || type;
    }

    const getCheckpointLabel = (type) => {
        const labels = {
            'meetup': 'Start Point',
            'stop': 'Pit Stop',
            'destination': 'Destination',
            'disbursement': 'End Point'
        };
        return labels[type?.toLowerCase()] || type;
    }

    const generateInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
    }

    const getAvatarColor = (name) => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
        const index = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[index];
    }

    // ============================================
    // RENDER
    // ============================================

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading ride details...</Text>
            </View>
        )
    }

    if (!ride) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={48} color="#FF5252" />
                    <Text style={styles.errorText}>Ride not found</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    const filterOptions = [
        { key: 'all', label: 'All' },
        { key: 'paid', label: 'Paid' },
        { key: 'unpaid', label: 'Unpaid' },
        { key: 'banned', label: 'Banned' },
    ];

    // Add attendance filters for active/completed rides
    if (ride.status === 'ACTIVE' || ride.status === 'active' || ride.status === 'COMPLETED' || ride.status === 'completed') {
        filterOptions.push({ key: 'present', label: 'Present' });
        filterOptions.push({ key: 'absent', label: 'Absent' });
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Feather name="arrow-left" size={22} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Ride Details</Text>
                <View style={styles.headerActions}>
                    {ride.is_admin && ride.status !== 'COMPLETED' && ride.status !== 'completed' && (
                        <TouchableOpacity
                            onPress={() => router.push(`/(main)/rides/${id}/edit`)}
                            style={styles.headerBtn}
                        >
                            <Feather name="edit-2" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    )}
                    {ride.is_admin && (
                        <TouchableOpacity onPress={handleCopyLink} style={styles.headerBtn}>
                            <Feather name="link" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
                        <Feather name="share-2" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Ride Info Card with integrated payment */}
                <View style={styles.infoCard}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.rideName}>{ride.name}</Text>
                            <Text style={styles.orgName}>{ride.organization?.name}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                            <View style={[styles.statusBadge, {
                                backgroundColor: getStatusColor(ride.status),
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6
                            }]}>
                                <Feather
                                    name={
                                        ride.status === 'COMPLETED' || ride.status === 'completed' ? 'check-circle' :
                                            ride.status === 'ACTIVE' || ride.status === 'active' ? 'activity' : 'calendar'
                                    }
                                    size={12}
                                    color="white"
                                />
                                <Text style={styles.statusText}>{ride.status?.toUpperCase()}</Text>
                            </View>

                            {/* Inline Admin Action Button */}
                            {ride.is_admin && (
                                <>
                                    {(ride.status === 'PLANNED' || ride.status === 'planned') && (
                                        <TouchableOpacity
                                            style={styles.headerActionButton}
                                            onPress={handleStartRide}
                                            disabled={statusLoading}
                                        >
                                            {statusLoading ? <ActivityIndicator size="small" color="white" /> : (
                                                <>
                                                    <Feather name="play" size={14} color="white" />
                                                    <Text style={styles.headerActionText}>Start</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}

                                    {(ride.status === 'ACTIVE' || ride.status === 'active') && (
                                        <TouchableOpacity
                                            style={[styles.headerActionButton, { backgroundColor: '#D50000' }]}
                                            onPress={handleEndRide}
                                            disabled={statusLoading}
                                        >
                                            {statusLoading ? <ActivityIndicator size="small" color="white" /> : (
                                                <>
                                                    <Feather name="square" size={14} color="white" />
                                                    <Text style={styles.headerActionText}>End</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}

                            {/* Open Map - Active Only */}
                            {(ride.status === 'ACTIVE' || ride.status === 'active') && (
                                <TouchableOpacity
                                    style={[styles.headerActionButton, { backgroundColor: '#2196F3' }]}
                                    onPress={() => {
                                        Alert.alert("Open Map", "Navigating to live map...");
                                    }}
                                >
                                    <Feather name="map" size={14} color="white" />
                                    <Text style={styles.headerActionText}>Open Map</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Feather name="calendar" size={16} color={theme.colors.primary} />
                            <Text style={styles.metaText}>
                                {ride.scheduled_date
                                    ? new Date(ride.scheduled_date).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                    })
                                    : 'TBD'}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="motorbike" size={18} color={theme.colors.primary} />
                            <Text style={styles.metaText}>{getRideTypeLabel(ride.ride_type)}</Text>
                        </View>
                        {/* Payment info inline */}
                        {ride.requires_payment && (
                            <View style={styles.metaItem}>
                                <Ionicons name="wallet-outline" size={16} color="#FFB300" />
                                <Text style={[styles.metaText, { color: '#FFB300' }]}>₹{ride.amount}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{ride.participants_count || 0}</Text>
                            <Text style={styles.statLabel}>Joined</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{ride.spots_left || 0}</Text>
                            <Text style={styles.statLabel}>Spots Left</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{ride.max_riders}</Text>
                            <Text style={styles.statLabel}>Max Riders</Text>
                        </View>
                    </View>
                </View>

                {/* Checkpoints Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Feather name="map-pin" size={16} color={theme.colors.primary} /> Route ({ride.checkpoints?.length || 0} stops)
                    </Text>
                    {ride.checkpoints && ride.checkpoints.length > 0 ? (
                        <View style={styles.checkpointsList}>
                            {ride.checkpoints.map((cp, index) => (
                                <View key={cp.id || index} style={styles.checkpointItem}>
                                    <View style={styles.checkpointLine}>
                                        <View style={[styles.checkpointDot, index === 0 && styles.startDot, index === ride.checkpoints.length - 1 && styles.endDot]} />
                                        {index < ride.checkpoints.length - 1 && <View style={styles.checkpointConnector} />}
                                    </View>
                                    <View style={styles.checkpointContent}>
                                        <Text style={styles.checkpointType}>{getCheckpointLabel(cp.type)}</Text>
                                        <Text style={styles.checkpointAddress} numberOfLines={2}>
                                            {cp.address || `${cp.latitude?.toFixed(4)}, ${cp.longitude?.toFixed(4)}`}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Feather name="map" size={32} color="#555" />
                            <Text style={styles.emptyText}>No checkpoints added yet</Text>
                        </View>
                    )}
                </View>

                {/* Participants Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>
                            <Feather name="users" size={16} color={theme.colors.primary} /> Participants ({filteredParticipants.length})
                        </Text>
                        <View style={styles.participantControls}>
                            {/* Sort toggle */}
                            <TouchableOpacity
                                style={[styles.sortBtn, sortAZ && styles.sortBtnActive]}
                                onPress={() => setSortAZ(!sortAZ)}
                            >
                                <Feather name="arrow-down" size={14} color={sortAZ ? theme.colors.primary : '#888'} />
                                <Text style={[styles.sortBtnText, sortAZ && { color: theme.colors.primary }]}>A-Z</Text>
                            </TouchableOpacity>
                            {ride.is_admin && (
                                <View style={styles.adminBadge}>
                                    <Feather name="shield" size={12} color={theme.colors.primary} />
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Filter tabs */}
                    {ride.is_admin && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            <View style={styles.filterRow}>
                                {filterOptions.map(opt => (
                                    <TouchableOpacity
                                        key={opt.key}
                                        style={[styles.filterChip, participantFilter === opt.key && styles.filterChipActive]}
                                        onPress={() => setParticipantFilter(opt.key)}
                                    >
                                        <Text style={[styles.filterChipText, participantFilter === opt.key && styles.filterChipTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    )}

                    {filteredParticipants.length > 0 ? (
                        <View style={styles.participantsList}>
                            {filteredParticipants.map((p, index) => {
                                const isBanned = p.role === 'banned';
                                const attendanceStatus = p.attendance_status;

                                return (
                                    <TouchableOpacity
                                        key={p.id || index}
                                        style={[styles.participantCard, isBanned && styles.bannedCard]}
                                        onPress={() => openParticipantActions(p)}
                                        disabled={!ride.is_admin}
                                        activeOpacity={ride.is_admin ? 0.7 : 1}
                                    >
                                        {/* Avatar */}
                                        {p.user?.profile_picture ? (
                                            <Image
                                                source={{ uri: p.user.profile_picture }}
                                                style={styles.participantAvatar}
                                            />
                                        ) : (
                                            <View style={[styles.participantAvatar, { backgroundColor: getAvatarColor(p.user?.name) }]}>
                                                <Text style={styles.participantInitials}>
                                                    {generateInitials(p.user?.name)}
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.participantInfo}>
                                            <View style={styles.participantNameRow}>
                                                <Text style={[styles.participantName, isBanned && styles.bannedText]}>
                                                    {p.user?.name || 'Unknown'}
                                                </Text>
                                                {p.role === 'lead' && (
                                                    <View style={styles.leadBadge}>
                                                        <Feather name="star" size={10} color="#FFB300" />
                                                    </View>
                                                )}
                                                {isBanned && (
                                                    <View style={styles.bannedBadge}>
                                                        <Feather name="slash" size={10} color="#FF5252" />
                                                    </View>
                                                )}
                                            </View>

                                            {/* Vehicle info */}
                                            {(p.vehicle || (user && (p.user_id === user.id || p.user?.id === user.id))) && (
                                                <View style={styles.vehicleRow}>
                                                    {p.vehicle ? (
                                                        <>
                                                            <MaterialCommunityIcons name="motorbike" size={13} color="#888" />
                                                            <Text style={styles.vehicleText}>
                                                                {p.vehicle.make} {p.vehicle.model}
                                                                {p.vehicle.license_plate && ` • ${p.vehicle.license_plate}`}
                                                            </Text>
                                                        </>
                                                    ) : (
                                                        <Text style={[styles.vehicleText, { color: '#FFB300', fontStyle: 'italic' }]}>
                                                            No vehicle info
                                                        </Text>
                                                    )}

                                                    {/* Edit/Add button - only if ride is PLANNED (not started/completed) */}
                                                    {user && (p.user_id === user.id || p.user?.id === user.id) &&
                                                        (ride.status === 'PLANNED' || ride.status === 'planned') && !isBanned && (
                                                            <TouchableOpacity
                                                                style={styles.editVehicleBtn}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    handleChangeVehiclePress();
                                                                }}
                                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                            >
                                                                <Feather
                                                                    name={p.vehicle ? "edit-2" : "plus"}
                                                                    size={14}
                                                                    color={theme.colors.primary}
                                                                />
                                                            </TouchableOpacity>
                                                        )}
                                                </View>
                                            )}

                                            {/* Phone for admins (email shown in modal) */}
                                            {ride.is_admin && p.user?.phone_number && (
                                                <View style={styles.contactRow}>
                                                    <Feather name="phone" size={11} color="#666" />
                                                    <Text style={styles.contactText}>{p.user.phone_number}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Status indicators */}
                                        <View style={styles.statusIndicators}>
                                            {ride.requires_payment && (
                                                <View style={[styles.indicatorBadge, p.has_paid ? styles.paidBadge : styles.unpaidBadge]}>
                                                    <Ionicons
                                                        name={p.has_paid ? "checkmark-circle" : "time-outline"}
                                                        size={14}
                                                        color={p.has_paid ? theme.colors.primary : "#FFB300"}
                                                    />
                                                </View>
                                            )}

                                            {(ride.status === 'ACTIVE' || ride.status === 'active' || ride.status === 'COMPLETED' || ride.status === 'completed') && (
                                                <View style={[
                                                    styles.indicatorBadge,
                                                    attendanceStatus === 'present' ? styles.presentBadge :
                                                        attendanceStatus === 'absent' ? styles.absentBadge :
                                                            styles.unmarkedBadge
                                                ]}>
                                                    <Feather
                                                        name={attendanceStatus === 'present' ? "check" : attendanceStatus === 'absent' ? "x" : "minus"}
                                                        size={12}
                                                        color={attendanceStatus === 'present' ? theme.colors.primary : attendanceStatus === 'absent' ? "#FF5252" : "#888"}
                                                    />
                                                </View>
                                            )}

                                            {ride.is_admin && (
                                                <Feather name="chevron-right" size={18} color="#555" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Feather name="user-plus" size={32} color="#555" />
                            <Text style={styles.emptyText}>
                                {participantFilter !== 'all'
                                    ? `No ${participantFilter} participants`
                                    : 'Be the first to join!'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                {!ride.is_participant ? (
                    (ride.status === 'PLANNED' || ride.status === 'planned') ? (
                        <TouchableOpacity
                            style={[styles.joinButton, ride.spots_left <= 0 && styles.disabledButton]}
                            onPress={handleJoinPress}
                            disabled={joining || ride.spots_left <= 0}
                        >
                            {joining ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Feather name="user-plus" size={20} color="white" />
                                    <Text style={styles.joinButtonText}>
                                        {ride.spots_left <= 0 ? 'Ride Full' : 'Join This Ride'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : null
                ) : (
                    <View style={styles.joinedFooter}>
                        <View style={styles.joinedBadge}>
                            <Feather name="check-circle" size={20} color={theme.colors.primary} />
                            <Text style={styles.joinedText}>You're joined!</Text>
                        </View>




                    </View>
                )}
            </View>

            {/* Admin Action Modal */}
            <Modal
                visible={showActionModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowActionModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowActionModal(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        {/* Participant Info Header */}
                        <View style={styles.modalHeader}>
                            {selectedParticipant?.user?.profile_picture ? (
                                <Image
                                    source={{ uri: selectedParticipant.user.profile_picture }}
                                    style={styles.modalAvatar}
                                />
                            ) : (
                                <View style={[styles.modalAvatar, { backgroundColor: getAvatarColor(selectedParticipant?.user?.name) }]}>
                                    <Text style={styles.modalAvatarText}>
                                        {generateInitials(selectedParticipant?.user?.name)}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.modalHeaderInfo}>
                                <Text style={styles.modalName}>{selectedParticipant?.user?.name || 'Unknown'}</Text>
                                {selectedParticipant?.vehicle && (
                                    <Text style={styles.modalVehicle}>
                                        {selectedParticipant.vehicle.make} {selectedParticipant.vehicle.model}
                                    </Text>
                                )}
                                {selectedParticipant?.user?.phone_number && (
                                    <Text style={styles.modalContact}>{selectedParticipant.user.phone_number}</Text>
                                )}
                                {selectedParticipant?.user?.email && (
                                    <Text style={styles.modalEmail}>{selectedParticipant.user.email}</Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowActionModal(false)}>
                                <Feather name="x" size={24} color="#888" />
                            </TouchableOpacity>
                        </View>

                        {/* Quick call button */}
                        {selectedParticipant?.user?.phone_number && (
                            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                                <Feather name="phone" size={18} color="white" />
                                <Text style={styles.callButtonText}>Call {selectedParticipant?.user?.name?.split(' ')[0]}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.modalActions}>
                            {/* Payment Toggle */}
                            {ride.requires_payment && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleMarkPayment}
                                    disabled={actionLoading}
                                >
                                    <View style={[styles.actionIcon, { backgroundColor: selectedParticipant?.has_paid ? '#1a3a1a' : '#3a2a1a' }]}>
                                        <Ionicons
                                            name={selectedParticipant?.has_paid ? "checkmark-circle" : "wallet-outline"}
                                            size={20}
                                            color={selectedParticipant?.has_paid ? theme.colors.primary : "#FFB300"}
                                        />
                                    </View>
                                    <View style={styles.actionTextContainer}>
                                        <Text style={styles.actionTitle}>
                                            {selectedParticipant?.has_paid ? '✓ Payment Confirmed' : 'Mark Payment Received'}
                                        </Text>
                                        <Text style={styles.actionSubtitle}>
                                            {selectedParticipant?.has_paid ? 'Tap to unmark' : `Amount: ₹${ride.amount}`}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {/* Attendance Buttons - only for non-completed rides */}
                            {(ride.status !== 'COMPLETED' && ride.status !== 'completed') && (
                                <>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleMarkAttendance('present')}
                                        disabled={actionLoading}
                                    >
                                        <View style={[styles.actionIcon, { backgroundColor: '#1a3a1a' }]}>
                                            <Feather name="check" size={20} color={theme.colors.primary} />
                                        </View>
                                        <View style={styles.actionTextContainer}>
                                            <Text style={styles.actionTitle}>Mark Present</Text>
                                            <Text style={styles.actionSubtitle}>Arrived at meetup point</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleMarkAttendance('absent')}
                                        disabled={actionLoading}
                                    >
                                        <View style={[styles.actionIcon, { backgroundColor: '#3a1a1a' }]}>
                                            <Feather name="x" size={20} color="#FF5252" />
                                        </View>
                                        <View style={styles.actionTextContainer}>
                                            <Text style={styles.actionTitle}>Mark Absent</Text>
                                            <Text style={styles.actionSubtitle}>Did not show up</Text>
                                        </View>
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Show attendance status if completed */}
                            {(ride.status === 'COMPLETED' || ride.status === 'completed') && selectedParticipant?.attendance_status && (
                                <View style={styles.actionButton}>
                                    <View style={[styles.actionIcon, { backgroundColor: selectedParticipant.attendance_status === 'present' ? '#1a3a1a' : '#3a1a1a' }]}>
                                        <Feather
                                            name={selectedParticipant.attendance_status === 'present' ? "check" : "x"}
                                            size={20}
                                            color={selectedParticipant.attendance_status === 'present' ? theme.colors.primary : "#FF5252"}
                                        />
                                    </View>
                                    <View style={styles.actionTextContainer}>
                                        <Text style={styles.actionTitle}>
                                            Marked {selectedParticipant.attendance_status === 'present' ? 'Present' : 'Absent'}
                                        </Text>
                                        <Text style={styles.actionSubtitle}>Ride Completed</Text>
                                    </View>
                                </View>
                            )}

                            {/* Ban/Unban */}
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleToggleBan}
                                disabled={actionLoading}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: selectedParticipant?.role === 'banned' ? '#1a3a1a' : '#3a2a1a' }]}>
                                    <Feather
                                        name={selectedParticipant?.role === 'banned' ? "user-check" : "slash"}
                                        size={20}
                                        color={selectedParticipant?.role === 'banned' ? theme.colors.primary : "#FF9800"}
                                    />
                                </View>
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionTitle}>
                                        {selectedParticipant?.role === 'banned' ? 'Unban Participant' : 'Ban from Ride'}
                                    </Text>
                                    <Text style={styles.actionSubtitle}>
                                        {selectedParticipant?.role === 'banned' ? 'Allow to participate again' : 'Prevent from joining'}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Remove */}
                            <TouchableOpacity
                                style={[styles.actionButton, styles.dangerAction]}
                                onPress={handleRemoveParticipant}
                                disabled={actionLoading}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: '#3a1a1a' }]}>
                                    <Feather name="user-x" size={20} color="#FF5252" />
                                </View>
                                <View style={styles.actionTextContainer}>
                                    <Text style={[styles.actionTitle, { color: '#FF5252' }]}>Remove from Ride</Text>
                                    <Text style={styles.actionSubtitle}>Remove participant (can rejoin later)</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {actionLoading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Vehicle Selection Modal */}
            <Modal
                visible={showVehicleModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowVehicleModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowVehicleModal(false)}
                >
                    <Pressable style={styles.vehicleModalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.vehicleModalHeader}>
                            <Text style={styles.vehicleModalTitle}>
                                {vehicleMode === 'join' ? 'Select Your Vehicle' : 'Change Vehicle'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                                <Feather name="x" size={24} color="#888" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.vehicleModalSubtitle}>
                            {vehicleMode === 'join'
                                ? "Choose which vehicle you'll be riding"
                                : "Select a different vehicle for this ride"
                            }
                        </Text>

                        {loadingVehicles ? (
                            <View style={styles.vehicleLoadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        ) : (
                            <ScrollView style={styles.vehicleList} showsVerticalScrollIndicator={false}>
                                {vehicles.map((vehicle) => (
                                    <TouchableOpacity
                                        key={vehicle.id}
                                        style={[
                                            styles.vehicleOption,
                                            selectedVehicle?.id === vehicle.id && styles.vehicleOptionSelected
                                        ]}
                                        onPress={() => setSelectedVehicle(vehicle)}
                                    >
                                        <View style={styles.vehicleOptionIcon}>
                                            <MaterialCommunityIcons
                                                name="motorbike"
                                                size={24}
                                                color={selectedVehicle?.id === vehicle.id ? theme.colors.primary : '#888'}
                                            />
                                        </View>
                                        <View style={styles.vehicleOptionInfo}>
                                            <Text style={styles.vehicleOptionName}>
                                                {vehicle.make} {vehicle.model}
                                            </Text>
                                            <Text style={styles.vehicleOptionDetails}>
                                                {vehicle.year && `${vehicle.year} • `}
                                                {vehicle.license_plate || 'No plate'}
                                                {vehicle.is_primary && ' • Primary'}
                                            </Text>
                                        </View>
                                        {selectedVehicle?.id === vehicle.id && (
                                            <Feather name="check-circle" size={22} color={theme.colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}

                                {/* Add New Vehicle */}
                                {!showAddVehicle ? (
                                    <TouchableOpacity
                                        style={styles.addVehicleButton}
                                        onPress={() => setShowAddVehicle(true)}
                                    >
                                        <Feather name="plus-circle" size={20} color={theme.colors.primary} />
                                        <Text style={styles.addVehicleButtonText}>Add New Vehicle</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.addVehicleForm}>
                                        <Text style={styles.addVehicleFormTitle}>Add New Vehicle</Text>

                                        <View style={styles.inputRow}>
                                            <TextInput
                                                style={[styles.input, { flex: 1 }]}
                                                placeholder="Make (e.g., Royal Enfield)"
                                                placeholderTextColor="#666"
                                                value={newVehicle.make}
                                                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, make: text }))}
                                            />
                                        </View>

                                        <View style={styles.inputRow}>
                                            <TextInput
                                                style={[styles.input, { flex: 1 }]}
                                                placeholder="Model (e.g., Himalayan)"
                                                placeholderTextColor="#666"
                                                value={newVehicle.model}
                                                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, model: text }))}
                                            />
                                        </View>

                                        <View style={styles.inputRow}>
                                            <TextInput
                                                style={[styles.input, { flex: 1, marginRight: 8 }]}
                                                placeholder="Year (optional)"
                                                placeholderTextColor="#666"
                                                keyboardType="number-pad"
                                                maxLength={4}
                                                value={newVehicle.year}
                                                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, year: text }))}
                                            />
                                            <TextInput
                                                style={[styles.input, { flex: 1.5 }]}
                                                placeholder="License Plate"
                                                placeholderTextColor="#666"
                                                autoCapitalize="characters"
                                                value={newVehicle.license_plate}
                                                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, license_plate: text }))}
                                            />
                                        </View>

                                        <View style={styles.addVehicleActions}>
                                            <TouchableOpacity
                                                style={styles.cancelAddBtn}
                                                onPress={() => {
                                                    setShowAddVehicle(false);
                                                    setNewVehicle({ make: '', model: '', year: '', license_plate: '' });
                                                }}
                                            >
                                                <Text style={styles.cancelAddBtnText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.saveAddBtn}
                                                onPress={handleAddVehicle}
                                                disabled={addingVehicle}
                                            >
                                                {addingVehicle ? (
                                                    <ActivityIndicator size="small" color="white" />
                                                ) : (
                                                    <Text style={styles.saveAddBtnText}>Save Vehicle</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </ScrollView>
                        )}

                        {/* Confirm Button */}
                        <TouchableOpacity
                            style={[styles.confirmJoinBtn, !selectedVehicle && styles.confirmJoinBtnDisabled]}
                            onPress={handleVehicleConfirm}
                            disabled={!selectedVehicle || joining || updatingVehicle}
                        >
                            {(joining || updatingVehicle) ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Feather name="check" size={20} color="white" />
                                    <Text style={styles.confirmJoinBtnText}>
                                        {!selectedVehicle
                                            ? 'Select a Vehicle'
                                            : vehicleMode === 'join'
                                                ? `Join with ${selectedVehicle.make} ${selectedVehicle.model}`
                                                : `Update to ${selectedVehicle.make} ${selectedVehicle.model}`
                                        }
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    )
}

export default RideDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        gap: 12,
    },
    loadingText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    errorText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    backBtn: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 10,
    },
    backBtnText: {
        color: theme.colors.textPrimary,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 4,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    infoCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 18,
        marginTop: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    titleContainer: {
        flex: 1,
        marginRight: 12,
    },
    rideName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    orgName: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 11,
        color: 'white',
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        paddingVertical: 12,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    statLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: theme.colors.border,
    },
    section: {
        marginTop: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    participantControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
    },
    sortBtnActive: {
        backgroundColor: 'rgba(0, 200, 83, 0.15)',
    },
    sortBtnText: {
        fontSize: 12,
        color: '#888',
    },
    adminBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 200, 83, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterScroll: {
        marginBottom: 12,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
    },
    filterChipActive: {
        backgroundColor: theme.colors.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    filterChipTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    checkpointsList: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 14,
    },
    checkpointItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    checkpointLine: {
        width: 24,
        alignItems: 'center',
    },
    checkpointDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#555',
        borderWidth: 2,
        borderColor: '#888',
    },
    startDot: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    endDot: {
        backgroundColor: '#FF5252',
        borderColor: '#FF5252',
    },
    checkpointConnector: {
        width: 2,
        flex: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 4,
    },
    checkpointContent: {
        flex: 1,
        marginLeft: 10,
        paddingBottom: 16,
    },
    checkpointType: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    checkpointAddress: {
        color: theme.colors.textSecondary,
        fontSize: 13,
    },
    participantsList: {
        gap: 8,
    },
    participantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 12,
    },
    bannedCard: {
        opacity: 0.6,
        borderWidth: 1,
        borderColor: '#FF5252',
    },
    participantAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    participantInitials: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    participantInfo: {
        flex: 1,
        marginLeft: 12,
    },
    participantNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    participantName: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    bannedText: {
        textDecorationLine: 'line-through',
    },
    leadBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#332800',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannedBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#3a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 3,
    },
    vehicleText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        flex: 1,
    },
    editVehicleBtn: {
        padding: 6,
        backgroundColor: 'rgba(0, 200, 83, 0.1)',
        borderRadius: 16,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    contactText: {
        color: '#666',
        fontSize: 11,
    },
    contactDivider: {
        color: '#444',
        marginHorizontal: 4,
    },
    statusIndicators: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    indicatorBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paidBadge: {
        backgroundColor: 'rgba(0, 200, 83, 0.15)',
    },
    unpaidBadge: {
        backgroundColor: 'rgba(255, 179, 0, 0.15)',
    },
    presentBadge: {
        backgroundColor: 'rgba(0, 200, 83, 0.15)',
    },
    absentBadge: {
        backgroundColor: 'rgba(255, 82, 82, 0.15)',
    },
    unmarkedBadge: {
        backgroundColor: 'rgba(136, 136, 136, 0.15)',
    },
    emptyState: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
        gap: 10,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        padding: 16,
        paddingBottom: 30,
    },
    joinButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    disabledButton: {
        backgroundColor: '#555',
    },
    joinButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    joinedFooter: {
        gap: 10,
    },
    joinedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.surface,
        paddingVertical: 12,
        borderRadius: 12,
    },
    joinedText: {
        color: theme.colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },

    trackButton: {
        flexDirection: 'row',
        backgroundColor: '#2962FF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    trackButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalAvatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    modalHeaderInfo: {
        flex: 1,
        marginLeft: 14,
    },
    modalName: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalVehicle: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    modalContact: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    modalEmail: {
        color: '#2962FF',
        fontSize: 12,
        marginTop: 1,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginTop: 16,
        paddingVertical: 12,
        backgroundColor: '#2962FF',
        borderRadius: 10,
    },
    callButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    modalActions: {
        padding: 16,
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: theme.colors.background,
        borderRadius: 12,
    },
    dangerAction: {
        borderWidth: 1,
        borderColor: 'rgba(255, 82, 82, 0.3)',
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTextContainer: {
        flex: 1,
        marginLeft: 14,
    },
    actionTitle: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    actionSubtitle: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
    },
    // Vehicle Selection Modal Styles
    vehicleModalContent: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    vehicleModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    vehicleModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    vehicleModalSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    vehicleLoadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    vehicleList: {
        maxHeight: 300,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    vehicleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    vehicleOptionSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(0, 200, 83, 0.1)',
    },
    vehicleOptionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleOptionInfo: {
        flex: 1,
        marginLeft: 12,
    },
    vehicleOptionName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textPrimary,
    },
    vehicleOptionDetails: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    addVehicleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
        borderRadius: 12,
        marginTop: 4,
    },
    addVehicleButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    addVehicleForm: {
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    addVehicleFormTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: theme.colors.textPrimary,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    addVehicleActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 6,
    },
    cancelAddBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
    },
    cancelAddBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    saveAddBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
    },
    saveAddBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'white',
    },
    confirmJoinBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 14,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
    },
    confirmJoinBtnDisabled: {
        backgroundColor: '#555',
    },
    confirmJoinBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    headerActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#00C853',
        borderRadius: 20,
        gap: 6,
        elevation: 2,
    },
    headerActionText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
})
