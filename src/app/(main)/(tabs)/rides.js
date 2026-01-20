import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, Animated } from 'react-native'
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/src/styles/theme'
import RideService from '@/src/apis/rideService'
import { router, useFocusEffect } from 'expo-router'
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'

const STATUS_FILTERS = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'active', label: 'Active', icon: 'activity' },
    { key: 'planned', label: 'Upcoming', icon: 'calendar' },
    { key: 'completed', label: 'Past', icon: 'check-circle' },
];

const SORT_OPTIONS = [
    { key: 'date', label: 'Date', order: 'desc' },
    { key: 'name', label: 'Name', order: 'asc' },
];

const RidesScreen = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showSearch, setShowSearch] = useState(false);

    const searchInputRef = useRef(null);
    const searchAnim = useRef(new Animated.Value(0)).current;

    const fetchRides = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);

            const params = {
                sortBy,
                sortOrder,
                includeCompleted: true,
            };

            if (activeFilter !== 'all') {
                params.status = activeFilter;
            }

            if (searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            const data = await RideService.getMyRides(params);

            if (data.status === 'success') {
                setRides(data.rides || []);
            }
        } catch (error) {
            console.error("Failed to fetch rides", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch on mount and when filters change
    useEffect(() => {
        fetchRides();
    }, [activeFilter, sortBy, sortOrder]);

    // Refetch when screen gains focus
    useFocusEffect(
        useCallback(() => {
            fetchRides();
        }, [activeFilter, sortBy, sortOrder, searchQuery])
    );

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== '') {
                fetchRides();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRides(true);
    };

    const toggleSearch = () => {
        if (showSearch) {
            Animated.timing(searchAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start(() => {
                setShowSearch(false);
                setSearchQuery('');
                fetchRides();
            });
        } else {
            setShowSearch(true);
            Animated.timing(searchAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
            }).start(() => {
                searchInputRef.current?.focus();
            });
        }
    };

    const toggleSort = () => {
        if (sortBy === 'date') {
            setSortBy('name');
            setSortOrder('asc');
        } else {
            setSortBy('date');
            setSortOrder('desc');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'ACTIVE': theme.colors.primary,
            'active': theme.colors.primary,
            'PLANNED': '#2962FF',
            'planned': '#2962FF',
            'COMPLETED': '#666',
            'completed': '#666',
            'CANCELLED': '#FF5252',
            'cancelled': '#FF5252'
        };
        return colors[status] || '#888';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'ACTIVE': 'activity',
            'active': 'activity',
            'PLANNED': 'calendar',
            'planned': 'calendar',
            'COMPLETED': 'check-circle',
            'completed': 'check-circle',
        };
        return icons[status] || 'circle';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'TBD';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const searchWidth = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const renderRideCard = ({ item }) => {
        const statusLower = item.status?.toLowerCase();
        const isPaid = item.my_payment_status?.has_paid;
        const requiresPayment = item.requires_payment;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(main)/rides/${item.id}`)}
                activeOpacity={0.7}
            >
                {/* Top Row: Name + Status */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleSection}>
                        <Text style={styles.rideName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.orgName} numberOfLines={1}>
                            <Feather name="users" size={12} color={theme.colors.textSecondary} /> {item.organization?.name || 'Unknown'}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Feather name={getStatusIcon(item.status)} size={12} color="white" />
                        <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
                    </View>
                </View>

                {/* Info Row */}
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Feather name="calendar" size={14} color={theme.colors.primary} />
                        <Text style={styles.infoText}>{formatDate(item.scheduled_date)}</Text>
                    </View>

                    <View style={styles.infoItem}>
                        <MaterialCommunityIcons name="motorbike" size={16} color={theme.colors.primary} />
                        <Text style={styles.infoText}>{item.participants_count || 0}/{item.max_riders}</Text>
                    </View>

                    {requiresPayment && (
                        <View style={[styles.paymentBadge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
                            <Ionicons
                                name={isPaid ? "checkmark-circle" : "wallet-outline"}
                                size={14}
                                color={isPaid ? theme.colors.primary : "#FFB300"}
                            />
                            <Text style={[styles.paymentText, isPaid ? styles.paidText : styles.unpaidText]}>
                                {isPaid ? 'Paid' : `₹${item.amount}`}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Chevron */}
                <View style={styles.chevronContainer}>
                    <Feather name="chevron-right" size={20} color="#555" />
                </View>
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <View style={styles.filtersContainer}>
            {/* Filter Chips */}
            <FlatList
                horizontal
                data={STATUS_FILTERS}
                keyExtractor={(item) => item.key}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChips}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            activeFilter === item.key && styles.filterChipActive
                        ]}
                        onPress={() => setActiveFilter(item.key)}
                    >
                        <Feather
                            name={item.icon}
                            size={14}
                            color={activeFilter === item.key ? 'white' : theme.colors.textSecondary}
                        />
                        <Text style={[
                            styles.filterChipText,
                            activeFilter === item.key && styles.filterChipTextActive
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="motorbike" size={64} color="#333" />
            </View>
            <Text style={styles.emptyTitle}>No Rides Found</Text>
            <Text style={styles.emptySubtitle}>
                {searchQuery
                    ? `No rides matching "${searchQuery}"`
                    : activeFilter === 'all'
                        ? "You haven't joined any rides yet.\nJoin a ride to see it here!"
                        : `No ${activeFilter} rides found.`
                }
            </Text>
            {activeFilter !== 'all' && (
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => {
                        setActiveFilter('all');
                        setSearchQuery('');
                    }}
                >
                    <Text style={styles.resetButtonText}>Show All Rides</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                {showSearch ? (
                    <Animated.View style={[styles.searchContainer, { width: searchWidth }]}>
                        <Feather name="search" size={18} color="#888" style={styles.searchIcon} />
                        <TextInput
                            ref={searchInputRef}
                            style={styles.searchInput}
                            placeholder="Search rides..."
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            returnKeyType="search"
                        />
                        <TouchableOpacity onPress={toggleSearch} style={styles.searchClose}>
                            <Feather name="x" size={20} color="#888" />
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <>
                        <Text style={styles.title}>My Rides</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity onPress={toggleSort} style={styles.headerBtn}>
                                <Feather name="sliders" size={20} color="white" />
                                <Text style={styles.sortLabel}>
                                    {sortBy === 'date' ? 'Date' : 'Name'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleSearch} style={styles.headerBtn}>
                                <Feather name="search" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Content */}
            {loading && rides.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading your rides...</Text>
                </View>
            ) : (
                <FlatList
                    data={rides}
                    renderItem={renderRideCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={ListHeader}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                            colors={[theme.colors.primary]}
                        />
                    }
                    ListEmptyComponent={EmptyState}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    )
}

export default RidesScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    sortLabel: {
        color: 'white',
        fontSize: 13,
        fontWeight: '500',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    searchClose: {
        padding: 4,
    },
    filtersContainer: {
        paddingVertical: 12,
    },
    filterChips: {
        paddingHorizontal: 16,
        gap: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    filterChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterChipText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: 'white',
    },
    listContent: {
        paddingBottom: 100,
    },
    card: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        position: 'relative',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitleSection: {
        flex: 1,
        marginRight: 12,
    },
    rideName: {
        fontSize: 17,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    orgName: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
    },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    paidBadge: {
        backgroundColor: 'rgba(0, 200, 83, 0.15)',
    },
    unpaidBadge: {
        backgroundColor: 'rgba(255, 179, 0, 0.15)',
    },
    paymentText: {
        fontSize: 12,
        fontWeight: '600',
    },
    paidText: {
        color: theme.colors.primary,
    },
    unpaidText: {
        color: '#FFB300',
    },
    chevronContainer: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: theme.colors.textSecondary,
        fontSize: 15,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    resetButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
    },
    resetButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
})
