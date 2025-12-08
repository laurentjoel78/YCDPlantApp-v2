import React, { useEffect, useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
    Alert,
} from 'react-native';
import { Text, Card, ActivityIndicator, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';

export default function UserApprovalsScreen() {
    const { token } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadPendingApprovals();
    }, []);

    const loadPendingApprovals = async () => {
        if (!token) return;

        try {
            setLoading(true);
            const data = await adminService.getPendingApprovals(token);
            setUsers(data);
        } catch (error) {
            console.error('Failed to load pending approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPendingApprovals();
        setRefreshing(false);
    };

    const handleApproval = async (userId: string, status: 'approved' | 'rejected') => {
        if (!token) return;

        const action = status === 'approved' ? 'approve' : 'reject';

        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
            `Are you sure you want to ${action} this user?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action.charAt(0).toUpperCase() + action.slice(1),
                    onPress: async () => {
                        try {
                            await adminService.updateApprovalStatus(token, userId, status);
                            Alert.alert('Success', `User ${status} successfully`);
                            loadPendingApprovals();
                        } catch (error) {
                            console.error(`Failed to ${action} user:`, error);
                            Alert.alert('Error', `Failed to ${action} user`);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.title}>User Approvals</Text>
                <Text style={styles.subtitle}>{users.length} pending approvals</Text>
            </View>

            {users.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <Card.Content style={styles.emptyContent}>
                        <MaterialCommunityIcons name="check-circle" size={64} color="#4CAF50" />
                        <Text style={styles.emptyText}>All caught up!</Text>
                        <Text style={styles.emptySubtext}>No pending user approvals</Text>
                    </Card.Content>
                </Card>
            ) : (
                users.map((user: any) => (
                    <UserApprovalCard
                        key={user.id}
                        user={user}
                        onApprove={() => handleApproval(user.id, 'approved')}
                        onReject={() => handleApproval(user.id, 'rejected')}
                    />
                ))
            )}
        </ScrollView>
    );
}

function UserApprovalCard({ user, onApprove, onReject }: any) {
    const roleColor = user.role === 'farmer' ? '#4CAF50' : '#2196F3';

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.userHeader}>
                    <View>
                        <Text style={styles.userName}>
                            {user.first_name} {user.last_name}
                        </Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                    <Chip
                        style={[styles.roleChip, { backgroundColor: roleColor }]}
                        textStyle={{ color: '#fff' }}
                    >
                        {user.role}
                    </Chip>
                </View>

                {user.phone_number && (
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="phone" size={16} color="#666" />
                        <Text style={styles.detailText}>{user.phone_number}</Text>
                    </View>
                )}

                {user.region && (
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                        <Text style={styles.detailText}>{user.region}</Text>
                    </View>
                )}

                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        Registered {new Date(user.created_at).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.actions}>
                    <Button
                        mode="contained"
                        onPress={onApprove}
                        style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                        icon="check"
                    >
                        Approve
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={onReject}
                        style={styles.actionButton}
                        textColor="#F44336"
                        icon="close"
                    >
                        Reject
                    </Button>
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
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    card: {
        margin: 12,
        elevation: 2,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
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
    roleChip: {
        marginLeft: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionButton: {
        flex: 1,
    },
});
