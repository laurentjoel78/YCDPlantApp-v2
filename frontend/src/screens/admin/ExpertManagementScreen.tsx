import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, Avatar, IconButton, Menu, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import { cacheService, CACHE_KEYS } from '../../services/cacheService';

const ExpertManagementScreen = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const { subscribe } = useSocket();
    // Use cached admin experts to avoid loading spinner on return visits
    const cachedExperts = cacheService.get<any[]>(CACHE_KEYS.ADMIN_EXPERTS);
    const [loading, setLoading] = useState(!cachedExperts);
    const [experts, setExperts] = useState<any[]>(cachedExperts || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuVisible, setMenuVisible] = useState<string | null>(null);

    const fetchExperts = useCallback(async () => {
        if (!token) {
            Alert.alert('Error', 'Authentication required');
            return;
        }
        try {
            if (experts.length === 0) setLoading(true);
            const data = await adminService.getExperts(token, { limit: 50 });
            const expertsList = data.experts || data || [];
            setExperts(expertsList);
            cacheService.set(CACHE_KEYS.ADMIN_EXPERTS, expertsList);
        } catch (error) {
            console.error('Error fetching experts:', error);
            Alert.alert('Error', 'Failed to load experts');
        } finally {
            setLoading(false);
        }
    }, [token, experts.length]);

    useEffect(() => {
        fetchExperts();
    }, [fetchExperts]);

    // Listen for real-time expert updates
    useEffect(() => {
        const events = ['EXPERT_CREATE', 'EXPERT_UPDATE', 'USER_UPDATE'];
        const unsubscribers = events.map(event =>
            subscribe(event, () => {
                cacheService.invalidate(CACHE_KEYS.ADMIN_EXPERTS);
                fetchExperts();
            })
        );
        return () => unsubscribers.forEach(unsub => unsub());
    }, [subscribe, fetchExperts]);

    const handleDeleteExpert = (expertId: string) => {
        if (!token) return;

        Alert.alert(
            'Delete Expert Profile',
            'Are you sure you want to remove this expert profile? The user account will remain active as a regular user.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await adminService.deleteExpert(token, expertId);
                            Alert.alert('Success', 'Expert profile deleted successfully');
                            fetchExperts();
                        } catch (error) {
                            console.error('Error deleting expert:', error);
                            Alert.alert('Error', 'Failed to delete expert');
                        }
                    }
                }
            ]
        );
    };


    const handleBlockExpert = (userId: string) => {
        if (!token) return;

        Alert.prompt(
            'Block Expert',
            'Enter reason for blocking:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Block',
                    onPress: async (reason?: string) => {
                        try {
                            await adminService.blockUser(token, userId, reason || 'Admin blocked');
                            Alert.alert('Success', 'Expert blocked successfully');
                            fetchExperts();
                        } catch (error) {
                            console.error('Error blocking expert:', error);
                            Alert.alert('Error', 'Failed to block expert');
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    const renderExpertCard = ({ item }: { item: any }) => {
        // Safely get user info with fallbacks
        const firstName = item?.user?.firstName || '';
        const lastName = item?.user?.lastName || '';
        const email = item?.user?.email || '';
        const initials = `${firstName[0] || '?'}${lastName[0] || '?'}`;

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.header}>
                        <View style={styles.userInfo}>
                            <Avatar.Text
                                size={40}
                                label={initials}
                                style={styles.avatar}
                            />
                            <View>
                                <Text variant="titleMedium">{firstName} {lastName}</Text>
                                <Text variant="bodySmall" style={styles.email}>{email}</Text>
                            </View>
                        </View>
                        <Menu
                            visible={menuVisible === item.id}
                            onDismiss={() => setMenuVisible(null)}
                            anchor={
                                <IconButton
                                    icon="dots-vertical"
                                    onPress={() => setMenuVisible(item.id)}
                                />
                            }
                        >
                            <Menu.Item
                                onPress={() => {
                                    setMenuVisible(null);
                                    handleBlockExpert(item.userId);
                                }}
                                title="Block Account"
                                leadingIcon="block-helper"
                            />
                            <Divider />
                            <Menu.Item
                                onPress={() => {
                                    setMenuVisible(null);
                                    handleDeleteExpert(item.userId);
                                }}
                                title="Delete Account"
                                leadingIcon="delete"
                                titleStyle={{ color: 'red' }}
                            />
                        </Menu>
                    </View>

                    <View style={styles.details}>
                        <View style={styles.row}>
                            <Text variant="bodyMedium" style={styles.label}>Rate:</Text>
                            <Text variant="bodyMedium">${item.hourlyRate}/hr</Text>
                        </View>
                        <View style={styles.row}>
                            <Text variant="bodyMedium" style={styles.label}>Experience:</Text>
                            <Text variant="bodyMedium">{item.experience} years</Text>
                        </View>
                    </View>

                    <View style={styles.chips}>
                        {item.specializations.map((spec: string, index: number) => (
                            <Chip key={index} style={styles.chip} compact>{spec}</Chip>
                        ))}
                    </View>
                </Card.Content>
            </Card>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Loading experts...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Search experts..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            <FlatList
                data={experts.filter((e: any) => {
                    const firstName = (e?.user?.firstName || '').toLowerCase();
                    const lastName = (e?.user?.lastName || '').toLowerCase();
                    const query = searchQuery.toLowerCase();
                    return firstName.includes(query) || lastName.includes(query);
                })}
                renderItem={renderExpertCard}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text>No experts found</Text>
                    </View>
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                // @ts-ignore - Navigation types will be updated
                onPress={() => navigation.navigate('AddExpert')}
                label="Add Expert"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
    },
    searchBar: {
        margin: 16,
        elevation: 2,
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    card: {
        marginBottom: 12,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        marginRight: 12,
        backgroundColor: '#2E7D32',
    },
    email: {
        color: '#666',
    },
    details: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontWeight: 'bold',
        marginRight: 4,
        color: '#555',
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
    },
    chip: {
        marginRight: 8,
        marginBottom: 4,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#2E7D32',
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
});

export default ExpertManagementScreen;
