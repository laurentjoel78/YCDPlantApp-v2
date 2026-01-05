import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Image
} from 'react-native';
import { Menu, Divider } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { useApp } from '../store/AppContext';
import { forumService } from '../services/forumService';
import { useSocket } from '../context/SocketContext';

type ForumChatScreenRouteProp = RouteProp<RootStackParamList, 'ForumDetails'>;

interface ChatMessage {
    id: string;
    content: string;
    messageType: string;
    createdAt: string;
    sender: {
        id: string;
        first_name: string;
        last_name: string;
        profile_image_url?: string;
    };
}

interface ForumInfo {
    id: string;
    title: string;
    description: string;
    memberCount: number;
    isMember: boolean;
}

export default function ForumChatScreen() {
    const route = useRoute<ForumChatScreenRouteProp>();
    const navigation = useNavigation();
    const { user } = useApp();
    const { t } = useTranslation();
    const forumId = route.params.forumId;

    const [forum, setForum] = useState<ForumInfo | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const { subscribe, joinRoom, leaveRoom } = useSocket();

    const fetchForumInfo = async () => {
        try {
            const response = await forumService.getForumTopic(forumId);
            setForum({
                id: response.topic.id,
                title: response.topic.name || response.topic.title || '',
                description: response.topic.description,
                memberCount: (response.topic as any).memberCount || 0,
                isMember: (response.topic as any).isMember || false
            });
        } catch (err) {
            console.error('Failed to fetch forum info:', err);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await api.forums.getMessages(forumId);
            if (response.success && response.data) {
                setMessages(response.data.messages || []);
            }
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch messages:', err);
            if (!messages.length) {
                setError('Failed to load messages');
            }
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchForumInfo(), fetchMessages()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();

        // Join forum room for real-time messages
        joinRoom(`forum_${forumId}`);

        // Subscribe to real-time forum messages
        const unsubscribe = subscribe('FORUM_MESSAGE', (data: any) => {
            if (data.message) {
                // Check if message already exists to prevent duplicates
                // (sender receives their own message back via socket)
                setMessages(prev => {
                    const exists = prev.some(m => m.id === data.message.id);
                    if (exists) return prev;
                    return [...prev, data.message];
                });
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        });


        return () => {
            leaveRoom(`forum_${forumId}`);
            unsubscribe();
        };
    }, [forumId, joinRoom, leaveRoom, subscribe]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchForumInfo(), fetchMessages()]);
        setRefreshing(false);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const response = await api.forums.sendMessage(forumId, newMessage.trim());
            if (response.success && response.data) {
                const messageData = response.data;
                setMessages(prev => {
                    const exists = prev.some(m => m.id === messageData.id);
                    if (exists) return prev;
                    return [...prev, messageData];
                });
                setNewMessage('');
                // Scroll to bottom
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || t('forum.chat.sendError'));
        } finally {
            setSending(false);
        }
    };

    const handleJoinForum = async () => {
        setJoining(true);
        try {
            await forumService.joinForum(forumId);
            setForum(prev => prev ? { ...prev, isMember: true, memberCount: prev.memberCount + 1 } : null);
            fetchMessages();
        } catch (err: any) {
            Alert.alert('Error', err.message || t('forum.chat.joinError'));
        } finally {
            setJoining(false);
        }
    };

    const handleLeaveForum = async () => {
        setMenuVisible(false);
        if (!forum?.isMember) return;

        Alert.alert(
            t('forum.chat.leaveTitle') || 'Leave Forum',
            t('forum.chat.leaveConfirm') || 'Are you sure you want to leave this forum?',
            [
                { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('forum.chat.leave') || 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Don't use full screen loading, just optimistic update or specific loading
                            await forumService.leaveForum(forumId);
                            setForum(prev => prev ? { ...prev, isMember: false, memberCount: Math.max(0, prev.memberCount - 1) } : null);
                            Alert.alert('Success', 'You have left the forum');
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to leave forum');
                        }
                    }
                }
            ]
        );
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return t('date.today');
        } else if (date.toDateString() === yesterday.toDateString()) {
            return t('date.yesterday');
        } else {
            return date.toLocaleDateString();
        }
    };

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isOwnMessage = item.sender?.id === user?.id;
        const itemDate = item.created_at || item.createdAt;
        const prevDate = messages[index - 1]?.created_at || messages[index - 1]?.createdAt;
        const showDateHeader = index === 0 || formatDate(itemDate) !== formatDate(prevDate);

        return (
            <View>
                {showDateHeader && (
                    <View style={styles.dateHeader}>
                        <Text style={styles.dateHeaderText}>{formatDate(itemDate)}</Text>
                    </View>
                )}
                <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
                    {!isOwnMessage && (
                        <View style={styles.avatarContainer}>
                            {(item.sender?.profile_image_url || item.sender?.profile_image) ? (
                                <Image source={{ uri: item.sender.profile_image_url || item.sender.profile_image }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.defaultAvatar]}>
                                    <Text style={styles.avatarText}>
                                        {((item.sender?.first_name || item.sender?.firstName)?.[0] || '?').toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                    <View style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
                        {!isOwnMessage && (
                            <Text style={styles.senderName}>
                                {item.sender?.first_name || item.sender?.firstName} {item.sender?.last_name || item.sender?.lastName}
                            </Text>
                        )}
                        <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
                            {item.content}
                        </Text>
                        <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
                            {formatTime(itemDate)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>{t('forum.chat.loading')}</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {forum?.title || t('forum.chat.title')}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {t('forum.chat.members', { count: forum?.memberCount || 0 })}
                    </Text>
                </View>

                {forum?.isMember && (
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerAction}>
                                <Icon name="dots-vertical" size={24} color="#333" />
                            </TouchableOpacity>
                        }
                    >
                        <Menu.Item onPress={handleLeaveForum} title={t('forum.chat.leave') || "Leave Forum"} leadingIcon="exit-to-app" />
                    </Menu>
                )}
            </View>

            {/* Join Banner (if not a member) */}
            {forum && !forum.isMember && (
                <View style={styles.joinBanner}>
                    <Text style={styles.joinBannerText}>{t('forum.chat.joinBanner')}</Text>
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={handleJoinForum}
                        disabled={joining}
                    >
                        {joining ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.joinButtonText}>{t('forum.chat.join')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Messages List */}
            {error ? (
                <View style={styles.errorContainer}>
                    <Icon name="alert-circle-outline" size={48} color="#f44336" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                        <Text style={styles.retryButtonText}>{t('forum.chat.retry')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="chat-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>{t('forum.chat.empty')}</Text>
                            <Text style={styles.emptySubtext}>
                                {forum?.isMember
                                    ? t('forum.chat.beFirst')
                                    : t('forum.chat.joinToStart')}
                            </Text>
                        </View>
                    }
                    onContentSizeChange={() => {
                        if (messages.length > 0) {
                            flatListRef.current?.scrollToEnd({ animated: false });
                        }
                    }}
                />
            )}

            {/* Message Input (only show if member) */}
            {forum?.isMember && (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder={t('forum.chat.placeholder')}
                        placeholderTextColor="#999"
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Icon name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,

    },
    headerAction: {
        padding: 8,
    },
    joinBanner: {
        backgroundColor: '#E8F5E9',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#C8E6C9',
    },
    joinBannerText: {
        flex: 1,
        fontSize: 14,
        color: '#2E7D32',
        marginRight: 12,
    },
    joinButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        minWidth: 100,
        alignItems: 'center',
    },
    joinButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    messagesList: {
        padding: 16,
        flexGrow: 1,
    },
    dateHeader: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateHeaderText: {
        fontSize: 12,
        color: '#999',
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    ownMessageContainer: {
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        marginRight: 8,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    defaultAvatar: {
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    otherBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
    },
    ownBubble: {
        backgroundColor: '#4CAF50',
        borderBottomRightRadius: 4,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 20,
    },
    ownMessageText: {
        color: '#fff',
    },
    messageTime: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    ownMessageTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        marginRight: 8,
    },
    sendButton: {
        backgroundColor: '#4CAF50',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
});
