import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/src/styles/theme'
import OrganizationService from '@/src/apis/organizationService'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'

const OrganizationsScreen = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrganizations = async () => {
        try {
            const data = await OrganizationService.getAllOrganizations();
            setOrganizations(data.organizations || []); // Adjust based on actual API response structure
        } catch (error) {
            console.error("Failed to fetch organizations", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrganizations();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(main)/organization/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.orgName}>{item.name}</Text>
                <Feather name="chevron-right" size={24} color="#00C853" />
            </View>
            <Text style={styles.orgDesc}>{item.description || "No description provided."}</Text>
            <View style={styles.statsRow}>
                <Text style={styles.statsText}>{item.member_count || 0} Members</Text>
                <Text style={styles.statsText}>{item.active_rides || 0} Active Rides</Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Organizations</Text>
                <TouchableOpacity onPress={() => router.push('/(main)/organization/create')}>
                    <Feather name="plus-circle" size={28} color="#00C853" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={organizations}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C853" />
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>You haven't joined any organizations yet.</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    )
}

export default OrganizationsScreen

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
    listContainer: {
        paddingBottom: 20
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
    orgName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white'
    },
    orgDesc: {
        fontSize: 14,
        color: '#AAA',
        marginBottom: 12
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16
    },
    statsText: {
        fontSize: 12,
        color: '#00C853'
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
