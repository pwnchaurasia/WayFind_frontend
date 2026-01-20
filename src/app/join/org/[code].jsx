import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrganizationService from '@/src/apis/organizationService';
import { useAuth } from '@/src/context/AuthContext';

export default function JoinOrganizationScreen() {
    const { code } = useLocalSearchParams();
    // Note: We don't wait for isLoading - just check isAuthenticated when needed
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [organization, setOrganization] = useState(null);
    const [error, setError] = useState(null);

    // Track if we've already attempted auto-join to prevent duplicates
    const hasAutoJoined = useRef(false);

    useEffect(() => {
        if (code) {
            fetchOrganization();
        } else {
            setLoading(false);
            setError('No join code provided');
        }
    }, [code]);

    // Auto-join when user returns authenticated after login flow
    useEffect(() => {
        console.log('JoinOrg useEffect - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated,
            'organization:', !!organization, 'hasAutoJoined:', hasAutoJoined.current, 'joining:', joining, 'loading:', loading);

        // Only auto-join if:
        // 1. Auth check is complete (not loading)
        // 2. User is authenticated
        // 3. Organization data is loaded
        // 4. We haven't already tried auto-joining
        // 5. Not currently joining
        if (!authLoading && isAuthenticated && organization && !hasAutoJoined.current && !joining && !loading) {
            console.log('✅ Auto-joining organization after auth complete');
            hasAutoJoined.current = true;
            performJoin();
        }
    }, [authLoading, isAuthenticated, organization, loading]);

    const fetchOrganization = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching organization with code:', code);
            const response = await OrganizationService.getOrgByJoinCode(code);
            console.log('Organization response:', response);
            if (response.status === 'success') {
                setOrganization(response.organization);
            } else {
                setError(response.message || 'Invalid or expired join code');
            }
        } catch (err) {
            console.error('Failed to fetch organization:', err);
            setError(err?.message || 'Failed to load organization details. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // Actual join logic - called by handleJoin and auto-join
    const performJoin = async () => {
        if (joining) return; // Prevent duplicate calls

        setJoining(true);
        try {
            const response = await OrganizationService.joinOrganization(code);

            if (response.status === 'success') {
                Alert.alert(
                    'Welcome!',
                    response.message,
                    [
                        {
                            text: 'Go to Organization',
                            onPress: () => router.replace(`/(main)/organization/${response.organization_id}`)
                        }
                    ]
                );
            } else if (response.status === 'already_member') {
                Alert.alert(
                    'Already a Member',
                    response.message,
                    [
                        {
                            text: 'Go to Organization',
                            onPress: () => router.replace(`/(main)/organization/${response.organization_id}`)
                        }
                    ]
                );
            } else if (response.requires_auth) {
                router.push({
                    pathname: '/(auth)/login',
                    params: { returnTo: `/join/org/${code}` }
                });
            } else {
                Alert.alert('Error', response.message || 'Failed to join');
            }
        } catch (err) {
            console.error('Failed to join organization:', err);
            Alert.alert('Error', err?.message || 'Failed to join organization');
        } finally {
            setJoining(false);
        }
    };

    // Button handler - checks auth first, then joins
    const handleJoin = async () => {
        // If auth is still loading or not authenticated, redirect to login
        // The returnTo param will bring them back here after login
        if (authLoading || !isAuthenticated) {
            hasAutoJoined.current = false; // Reset so auto-join triggers after login
            router.push({
                pathname: '/(auth)/login',
                params: { returnTo: `/join/org/${code}` }
            });
            return;
        }

        // User is authenticated, perform the join
        performJoin();
    };

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    const generateInitials = (name) => {
        if (!name) return 'O';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00C853" />
                    <Text style={styles.loadingText}>Loading organization...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={64} color="#FF4444" />
                    <Text style={styles.errorTitle}>Oops!</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Feather name="users" size={32} color="#00C853" />
                    <Text style={styles.headerTitle}>Join Organization</Text>
                </View>

                {/* Organization Card */}
                <View style={styles.orgCard}>
                    {organization?.logo ? (
                        <Image source={{ uri: organization.logo }} style={styles.orgLogo} />
                    ) : (
                        <View style={styles.orgLogoPlaceholder}>
                            <Text style={styles.orgLogoText}>
                                {generateInitials(organization?.name)}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.orgName}>{organization?.name}</Text>

                    {organization?.description && (
                        <Text style={styles.orgDescription} numberOfLines={3}>
                            {organization.description}
                        </Text>
                    )}

                    <View style={styles.statsRow}>
                        <Feather name="users" size={16} color="#00C853" />
                        <Text style={styles.statsText}>
                            {organization?.members_count || 0} members
                        </Text>
                    </View>
                </View>

                {/* Auth Status */}
                {(authLoading || !isAuthenticated) && (
                    <View style={styles.authNotice}>
                        <Feather name="info" size={16} color="#FF9800" />
                        <Text style={styles.authNoticeText}>
                            {authLoading
                                ? 'Checking your session...'
                                : "You'll need to login or sign up to join"}
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={handleJoin}
                        disabled={joining}
                    >
                        {joining ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Feather name="user-plus" size={20} color="#fff" />
                                <Text style={styles.joinButtonText}>
                                    {isAuthenticated ? 'Join Organization' : 'Login & Join'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={handleGoBack}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#888',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    errorTitle: {
        color: '#FF4444',
        fontSize: 24,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
        backgroundColor: '#333',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        gap: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    orgCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    orgLogo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
    },
    orgLogoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#00C853',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    orgLogoText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    orgName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    orgDescription: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statsText: {
        color: '#00C853',
        fontSize: 14,
        fontWeight: '600',
    },
    authNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        padding: 14,
        borderRadius: 10,
        gap: 10,
        marginBottom: 20,
    },
    authNoticeText: {
        color: '#FF9800',
        fontSize: 14,
        flex: 1,
    },
    buttonContainer: {
        marginTop: 'auto',
        gap: 12,
    },
    joinButton: {
        flexDirection: 'row',
        backgroundColor: '#00C853',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#888',
        fontSize: 16,
    },
});
