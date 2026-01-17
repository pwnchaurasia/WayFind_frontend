import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/src/styles/theme'
import RideService from '@/src/apis/rideService'
// Note: RideService.getAllRides might not exist, usually filtered by Org or User.
// We'll assume we list User's rides here.
import UserService from '@/src/apis/userService'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'

const RidesScreen = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // For this screen, we might want "My Rides"
    const fetchRides = async () => {
        try {
            // Assuming endpoint to get user's rides exists or we use organization rides
            //   const data = await UserService.getUserRides(); // Need to implement this in UserService if not present
            // Or just mock for now until endpoint is confirmed
            setRides([]);
        } catch (error) {
            console.error("Failed to fetch rides", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        fetchRides();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRides();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(main)/rides/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.rideName}>{item.name}</Text>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'ACTIVE' || item.status === 'active' ? '#00C853' :
                        item.status === 'COMPLETED' || item.status === 'completed' ? '#2962FF' : '#FFB300',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 10,
                    borderRadius: 12
                }]}>
                    <Feather
                        name={
                            item.status === 'COMPLETED' || item.status === 'completed' ? 'check-circle' :
                                item.status === 'ACTIVE' || item.status === 'active' ? 'activity' : 'calendar'
                        }
                        size={12}
                        color="white"
                    />
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            <Text style={styles.rideDetail}><Feather name="calendar" /> {new Date(item.start_time).toLocaleDateString()}</Text>
            <Text style={styles.rideDetail}><Feather name="map-pin" /> {item.checkpoints?.length} Checkpoints</Text>
        </TouchableOpacity>
    )

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Rides</Text>
                {/* Only Org Admins can create rides usually, done from Org context. 
            So maybe no create button here directly? Or conditionally rendered. */}
            </View>

            <FlatList
                data={rides}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C853" />
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No upcoming rides found.</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    )
}

export default RidesScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white'
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    rideName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold'
    },
    rideDetail: {
        color: '#AAA',
        marginBottom: 4
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center'
    },
    emptyText: {
        color: '#AAA',
        fontSize: 16
    }
})
