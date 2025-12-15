import React, { useEffect, useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
    Alert,
} from 'react-native';
import { Text, Card, ActivityIndicator, Button, Chip, Searchbar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';

export default function UserManagementScreen() {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const LIMIT = 20;

    useEffect(() => {
        loadUsers();
    }, [page, searchQuery]);

    const loadUsers = async () => {
        if (!token) return;

        try {
            setLoading(true);
            const data = await adminService.getUsers(token, {
                limit: LIMIT,
                offset: page * LIMIT,
                search: searchQuery
            });
            setUsers(data.rows || []);
            setTotalUsers(data.count || 0);
        } catch (error) {
            console.error('Failed to load users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setPage(0); // Reset to first page
        await loadUsers();
        setRefreshing(false);
    };

    const handleDeleteUser = async (userToDelete: any) => {
        if (!token) return;

        Alert.alert(
            'Delete User',
            `Are you sure you want to delete ${userToDelete.email}? This will delete all their farms, products, and contributions. This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await adminService.deleteUser(token, userToDelete.id);
                            Alert.alert('Success', 'User deleted successfully');
                            loadUsers();
                        } catch (error: any) {
                            console.error('Failed to delete user:', error);
                            Alert.alert('Error', error.message || 'Failed to delete user');
                        }
                    },
                },
            ]
        );
    };

    const onChangeSearch = (query: string) => {
        setSearchQuery(query);
        setPage(0);
    };

    if (loading && !refreshing && users.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search users..."
                    onChangeText={onChangeSearch}
                    value={searchQuery}
                    style={styles.searchBar}
                />
            </View>

            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.title}>User Management</Text>
                    <Text style={styles.subtitle}>{totalUsers} users found</Text>
                </View>

                {users.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Card.Content style={styles.emptyContent}>
                            <MaterialCommunityIcons name="account-search" size={64} color="#666" />
                            <Text style={styles.emptyText}>No users found</Text>
                        </Card.Content>
                    </Card>
                ) : (
                    users.map((user: any) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            currentUserId={currentUser?.id}
                            onDelete={() => handleDeleteUser(user)}
                        />
                    ))
                )}

                {/* Simple Pagination Controls */}
                <View style={styles.pagination}>
                    <Button
                        disabled={page === 0}
                        onPress={() => setPage(p => Math.max(0, p - 1))}
                    >
                        Previous
                    </Button>
                    <Text>Page {page + 1}</Text>
                    <Button
                        disabled={(page + 1) * LIMIT >= totalUsers}
                        onPress={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </View>
            </ScrollView>
        </View>
    );
}

function UserCard({ user, currentUserId, onDelete }: any) {
    const roleColor = user.role === 'admin' ? '#F44336' : user.role === 'expert' ? '#2196F3' : '#4CAF50';
    const isSelf = user.id === currentUserId;

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.userHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.userName}>
                            {user.first_name} {user.last_name} {isSelf && '(You)'}
                        </Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <Text style={styles.userId}>ID: {user.id}</Text>
                    </View>
                    <Chip
                        style={[styles.roleChip, { backgroundColor: roleColor }]}
                        textStyle={{ color: '#fff' }}
                    >
                        {user.role}
                    </Chip>
                </View>

                <View style={styles.actions}>
                    {!isSelf && (
                        <Button
                            mode="outlined"
                            onPress={onDelete}
                            textColor="#F44336"
                            icon="delete"
                            style={{ borderColor: '#F44336' }}
                        >
                            Delete User
                        </Button>
                    )}
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchBar: {
        elevation: 0,
        backgroundColor: '#F5F5F5',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    emptyCard: {
        margin: 20,
        elevation: 2,
    },
    emptyContent: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginTop: 16,
    },
    card: {
        marginHorizontal: 16,
        marginVertical: 8,
        elevation: 2,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    userId: {
        fontSize: 10,
        color: '#999',
        marginTop: 2
    },
    roleChip: {
        marginLeft: 8,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16
    }
});
