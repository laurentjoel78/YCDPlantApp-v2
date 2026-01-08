import React, { useEffect, useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
    Alert,
    Modal,
} from 'react-native';
import { Text, Card, ActivityIndicator, Button, Chip, Searchbar, IconButton, TextInput, Portal, Dialog, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
}

export default function UserManagementScreen() {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const LIMIT = 20;

    // Edit modal state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: '',
        is_active: true,
        is_verified: true,
    });
    const [saving, setSaving] = useState(false);

    // Password reset modal state
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [resettingPassword, setResettingPassword] = useState(false);

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
        setPage(0);
        await loadUsers();
        setRefreshing(false);
    };

    const handleDeleteUser = async (userToDelete: User) => {
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

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setEditForm({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || 'user',
            is_active: user.is_active !== false,
            is_verified: user.is_verified !== false,
        });
        setEditModalVisible(true);
    };

    const handleSaveUser = async () => {
        if (!token || !selectedUser) return;

        setSaving(true);
        try {
            await adminService.updateUser(token, selectedUser.id, editForm);
            Alert.alert('Success', 'User updated successfully');
            setEditModalVisible(false);
            loadUsers();
        } catch (error: any) {
            console.error('Failed to update user:', error);
            Alert.alert('Error', error.message || 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenPasswordReset = (user: User) => {
        setSelectedUser(user);
        setNewPassword('');
        setConfirmPassword('');
        setGeneratedPassword(null);
        setPasswordModalVisible(true);
    };

    const handleResetPassword = async (generateRandom: boolean = false) => {
        if (!token || !selectedUser) return;

        if (!generateRandom) {
            if (!newPassword) {
                Alert.alert('Error', 'Please enter a new password');
                return;
            }
            if (newPassword.length < 6) {
                Alert.alert('Error', 'Password must be at least 6 characters');
                return;
            }
            if (newPassword !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
            }
        }

        setResettingPassword(true);
        try {
            const result = await adminService.resetUserPassword(token, selectedUser.id, 
                generateRandom ? { generateRandom: true } : { newPassword }
            );
            
            if (result.data?.temporaryPassword) {
                setGeneratedPassword(result.data.temporaryPassword);
                Alert.alert(
                    'Password Reset',
                    `New temporary password: ${result.data.temporaryPassword}\n\nPlease share this password securely with the user.`
                );
            } else {
                Alert.alert('Success', 'Password has been reset successfully');
                setPasswordModalVisible(false);
            }
        } catch (error: any) {
            console.error('Failed to reset password:', error);
            Alert.alert('Error', error.message || 'Failed to reset password');
        } finally {
            setResettingPassword(false);
        }
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
                    users.map((user: User) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            currentUserId={currentUser?.id}
                            onEdit={() => handleEditUser(user)}
                            onDelete={() => handleDeleteUser(user)}
                            onResetPassword={() => handleOpenPasswordReset(user)}
                        />
                    ))
                )}

                {/* Pagination Controls */}
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

            {/* Edit User Modal */}
            <Portal>
                <Dialog visible={editModalVisible} onDismiss={() => setEditModalVisible(false)} style={styles.dialog}>
                    <Dialog.Title>Edit User</Dialog.Title>
                    <Dialog.ScrollArea style={styles.dialogScrollArea}>
                        <ScrollView>
                            <TextInput
                                label="First Name"
                                value={editForm.first_name}
                                onChangeText={(text) => setEditForm({ ...editForm, first_name: text })}
                                style={styles.dialogInput}
                                mode="outlined"
                            />
                            <TextInput
                                label="Last Name"
                                value={editForm.last_name}
                                onChangeText={(text) => setEditForm({ ...editForm, last_name: text })}
                                style={styles.dialogInput}
                                mode="outlined"
                            />
                            <TextInput
                                label="Email"
                                value={editForm.email}
                                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                                style={styles.dialogInput}
                                mode="outlined"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TextInput
                                label="Phone"
                                value={editForm.phone}
                                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                                style={styles.dialogInput}
                                mode="outlined"
                                keyboardType="phone-pad"
                            />
                            
                            <Text style={styles.roleLabel}>Role</Text>
                            <View style={styles.roleButtons}>
                                {['user', 'farmer', 'expert', 'admin'].map((role) => (
                                    <Chip
                                        key={role}
                                        selected={editForm.role === role}
                                        onPress={() => setEditForm({ ...editForm, role })}
                                        style={styles.roleChipSelect}
                                    >
                                        {role}
                                    </Chip>
                                ))}
                            </View>

                            <View style={styles.toggleRow}>
                                <Text>Active</Text>
                                <Button
                                    mode={editForm.is_active ? 'contained' : 'outlined'}
                                    onPress={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                                    compact
                                >
                                    {editForm.is_active ? 'Yes' : 'No'}
                                </Button>
                            </View>

                            <View style={styles.toggleRow}>
                                <Text>Verified</Text>
                                <Button
                                    mode={editForm.is_verified ? 'contained' : 'outlined'}
                                    onPress={() => setEditForm({ ...editForm, is_verified: !editForm.is_verified })}
                                    compact
                                >
                                    {editForm.is_verified ? 'Yes' : 'No'}
                                </Button>
                            </View>
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setEditModalVisible(false)}>Cancel</Button>
                        <Button onPress={handleSaveUser} loading={saving} disabled={saving}>
                            Save
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Password Reset Modal */}
            <Portal>
                <Dialog visible={passwordModalVisible} onDismiss={() => setPasswordModalVisible(false)} style={styles.dialog}>
                    <Dialog.Title>Reset Password</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.passwordUserInfo}>
                            Reset password for: {selectedUser?.email}
                        </Text>
                        
                        <Divider style={styles.divider} />

                        <Text style={styles.sectionTitle}>Option 1: Set New Password</Text>
                        <TextInput
                            label="New Password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            style={styles.dialogInput}
                            mode="outlined"
                            secureTextEntry
                        />
                        <TextInput
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            style={styles.dialogInput}
                            mode="outlined"
                            secureTextEntry
                        />
                        <Button
                            mode="contained"
                            onPress={() => handleResetPassword(false)}
                            loading={resettingPassword}
                            disabled={resettingPassword}
                            style={styles.resetButton}
                        >
                            Set Password
                        </Button>

                        <Divider style={styles.divider} />

                        <Text style={styles.sectionTitle}>Option 2: Generate Random Password</Text>
                        <Button
                            mode="outlined"
                            onPress={() => handleResetPassword(true)}
                            loading={resettingPassword}
                            disabled={resettingPassword}
                            style={styles.resetButton}
                            icon="dice-multiple"
                        >
                            Generate Random Password
                        </Button>

                        {generatedPassword && (
                            <View style={styles.generatedPasswordBox}>
                                <Text style={styles.generatedLabel}>Generated Password:</Text>
                                <Text style={styles.generatedPassword}>{generatedPassword}</Text>
                                <Text style={styles.generatedNote}>Share this password securely with the user</Text>
                            </View>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setPasswordModalVisible(false)}>Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

interface UserCardProps {
    user: User;
    currentUserId?: string;
    onEdit: () => void;
    onDelete: () => void;
    onResetPassword: () => void;
}

function UserCard({ user, currentUserId, onEdit, onDelete, onResetPassword }: UserCardProps) {
    const roleColor = user.role === 'admin' ? '#F44336' : user.role === 'expert' ? '#2196F3' : user.role === 'farmer' ? '#4CAF50' : '#9E9E9E';
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
                        {user.phone && <Text style={styles.userPhone}>📞 {user.phone}</Text>}
                        <View style={styles.statusRow}>
                            <Chip 
                                style={[styles.statusChip, { backgroundColor: user.is_active ? '#E8F5E9' : '#FFEBEE' }]}
                                textStyle={{ color: user.is_active ? '#2E7D32' : '#C62828', fontSize: 10 }}
                                compact
                            >
                                {user.is_active ? 'Active' : 'Inactive'}
                            </Chip>
                            <Chip 
                                style={[styles.statusChip, { backgroundColor: user.is_verified ? '#E3F2FD' : '#FFF3E0' }]}
                                textStyle={{ color: user.is_verified ? '#1565C0' : '#EF6C00', fontSize: 10 }}
                                compact
                            >
                                {user.is_verified ? 'Verified' : 'Unverified'}
                            </Chip>
                        </View>
                    </View>
                    <Chip
                        style={[styles.roleChip, { backgroundColor: roleColor }]}
                        textStyle={{ color: '#fff' }}
                    >
                        {user.role}
                    </Chip>
                </View>

                <View style={styles.actions}>
                    <Button
                        mode="outlined"
                        onPress={onEdit}
                        icon="pencil"
                        compact
                        style={styles.actionButton}
                    >
                        Edit
                    </Button>
                    {!isSelf && (
                        <>
                            <Button
                                mode="outlined"
                                onPress={onResetPassword}
                                icon="lock-reset"
                                compact
                                style={styles.actionButton}
                            >
                                Password
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={onDelete}
                                textColor="#F44336"
                                icon="delete"
                                compact
                                style={[styles.actionButton, { borderColor: '#F44336' }]}
                            >
                                Delete
                            </Button>
                        </>
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
    userPhone: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    statusRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    statusChip: {
        height: 24,
    },
    roleChip: {
        marginLeft: 8,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 8,
        flexWrap: 'wrap',
    },
    actionButton: {
        marginLeft: 4,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    dialog: {
        maxHeight: '80%',
    },
    dialogScrollArea: {
        paddingHorizontal: 0,
    },
    dialogInput: {
        marginBottom: 12,
        marginHorizontal: 16,
    },
    roleLabel: {
        fontSize: 14,
        color: '#666',
        marginLeft: 16,
        marginBottom: 8,
    },
    roleButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    roleChipSelect: {
        marginRight: 4,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    passwordUserInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    divider: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    resetButton: {
        marginTop: 8,
    },
    generatedPasswordBox: {
        backgroundColor: '#E8F5E9',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        alignItems: 'center',
    },
    generatedLabel: {
        fontSize: 12,
        color: '#666',
    },
    generatedPassword: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginVertical: 8,
        fontFamily: 'monospace',
    },
    generatedNote: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
});
