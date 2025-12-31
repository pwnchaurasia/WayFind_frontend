import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/src/styles/theme'
import OrganizationService from '@/src/apis/organizationService'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '@/src/context/AuthContext'

const OrganizationsScreen = () => {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const fetchOrganizations = async () => {
        try {
            const data = await OrganizationService.getAllOrganizations();
            setOrganizations(data.organizations || []);
            setIsSuperAdmin(data.is_super_admin || false);
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

    const getRoleBadge = (role) => {
        const roleStyles = {
            founder: { bg: '#00C853', text: 'Founder' },
            co_founder: { bg: '#2196F3', text: 'Co-Founder' },
            admin: { bg: '#FF9800', text: 'Admin' },
            super_admin: { bg: '#9C27B0', text: 'Super Admin' }
        };
        return roleStyles[role] || { bg: '#666', text: role || 'Member' };
    };

    const renderItem = ({ item }) => {
        const roleInfo = getRoleBadge(item.user_role);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(main)/organization/${item.id}`)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.nameSection}>
                        <Text style={styles.orgName}>{item.name}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
                            <Text style={styles.roleText}>{roleInfo.text}</Text>
                        </View>
                    </View>
                    <Feather name="chevron-right" size={24} color="#00C853" />
                </View>
                <Text style={styles.orgDesc} numberOfLines={2}>
                    {item.description || "No description provided."}
                </Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Feather name="users" size={14} color="#00C853" />
                        <Text style={styles.statsText}>{item.members_count || 0} Members</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Communities</Text>
                {/* Only Super Admin can create organizations */}
                {isSuperAdmin && (
                    <TouchableOpacity onPress={() => router.push('/(main)/organization/create')}>
                        <Feather name="plus-circle" size={28} color="#00C853" />
                    </TouchableOpacity>
                )}
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
                            <Feather name="users" size={48} color="#666" />
                            <Text style={styles.emptyText}>You haven't joined any communities yet.</Text>
                            <Text style={styles.emptySubtext}>Join a ride to become part of a community!</Text>
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
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    nameSection: {
        flex: 1,
        marginRight: 12
    },
    orgName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 6
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    roleText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'white'
    },
    orgDesc: {
        fontSize: 14,
        color: '#AAA',
        marginBottom: 12,
        lineHeight: 20
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    statsText: {
        fontSize: 13,
        color: '#00C853'
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        gap: 12
    },
    emptyText: {
        color: '#AAA',
        fontSize: 16,
        textAlign: 'center'
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center'
    }
})
