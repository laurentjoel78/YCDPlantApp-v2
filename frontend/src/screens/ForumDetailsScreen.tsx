import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ForumPostCard } from '../components/ForumPostCard';
import { forumService } from '../services/forumService';
import { ForumCategory, ForumPost, ForumMember } from '../types/forum';
import { RootStackParamList } from '../navigation/types';
import { FAB } from 'react-native-paper';
import { useApp } from '../store/AppContext';

type ForumDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ForumDetails'>;

export default function ForumDetailsScreen() {
    const route = useRoute<ForumDetailsScreenRouteProp>();
    const navigation = useNavigation();
    const { user } = useApp();
    const forumId = route.params.forumId;
    const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
    const [forum, setForum] = useState<ForumCategory | null>(null);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [members, setMembers] = useState<ForumMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [joiningLeaving, setJoiningLeaving] = useState(false);

    const fetchForumDetails = async () => {
        try {
            const response = await forumService.getForumTopic(forumId);
            setForum(response.topic);
            setPosts(response.posts);

            // Fetch members
            try {
                const membersData = await forumService.getForumMembers(forumId);
                setMembers(membersData);
            } catch (err) {
                console.log('Could not fetch members:', err);
            }

            setError(null);
        } catch (err) {
            setError('Failed to load forum details. Please try again.');
            console.error('Failed to fetch forum details:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchForumDetails();
    }, [forumId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchForumDetails();
    };

    const handleJoinForum = async () => {
        if (!forum) return;

        try {
            setJoiningLeaving(true);

            // Optimistic update
            setForum({ ...forum, isMember: true, memberCount: (forum.memberCount || 0) + 1 });

            await forumService.joinForum(forum.id);

            Alert.alert(
                'Succès',
                'Vous avez rejoint le forum! Vous pouvez maintenant participer aux discussions.',
                [{ text: 'OK' }]
            );

            // Refresh to get updated data
            await fetchForumDetails();
        } catch (error: any) {
            console.error('Failed to join forum:', error);
            // Revert optimistic update on error
            setForum({ ...forum, isMember: false, memberCount: (forum.memberCount || 0) });

            Alert.alert(
                'Erreur',
                error.message || 'Impossible de rejoindre le forum.',
                [{ text: 'OK' }]
            );
        } finally {
            setJoiningLeaving(false);
        }
    };

    const handleLeaveForum = async () => {
        if (!forum) return;

        Alert.alert(
            'Quitter le forum',
            'Êtes-vous sûr de vouloir quitter ce forum?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Quitter',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setJoiningLeaving(true);
                            await forumService.leaveForum(forum.id);

                            Alert.alert(
                                'Forum quitté',
                                'Vous avez quitté le forum.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => navigation.goBack()
                                    }
                                ]
                            );
                        } catch (error: any) {
                            console.error('Failed to leave forum:', error);
                            Alert.alert('Erreur', error.message || 'Impossible de quitter le forum.');
                        } finally {
                            setJoiningLeaving(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2D5016" />
            </View>
        );
    }

    if (error || !forum) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={48} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => fetchForumDetails()}
                >
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isMember = forum.isMember || false;
    const sortedPosts = [...posts].sort((a, b) => {
        if (sortBy === 'recent') {
            const dateA = new Date((a as any).created_at || a.createdAt).getTime();
            const dateB = new Date((b as any).created_at || b.createdAt).getTime();
            return dateB - dateA;
        } else {
            return ((b as any).likes_count || b.likesCount || 0) - ((a as any).likes_count || a.likesCount || 0);
        }
    });

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2D5016']}
                        tintColor="#2D5016"
                    />
                }
            >
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{forum.name || forum.title}</Text>
                        {isMember && (
                            <View style={styles.memberBadge}>
                                <Icon name="check-circle" size={16} color="#FFFFFF" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.description}>{forum.description}</Text>

                    <View style={styles.stats}>
                        <View style={styles.statItem}>
                            <Icon name="account-group" size={18} color="#6B7280" />
                            <Text style={styles.statText}>{members.length} membres</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Icon name="message" size={18} color="#6B7280" />
                            <Text style={styles.statText}>{forum.postsCount || 0} messages</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Icon name="map-marker" size={18} color="#6B7280" />
                            <Text style={styles.statText}>{forum.region}</Text>
                        </View>
                    </View>

                    {!isMember ? (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.joinButton]}
                            onPress={handleJoinForum}
                            disabled={joiningLeaving}
                        >
                            {joiningLeaving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Icon name="account-plus" size={20} color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Rejoindre ce forum</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.leaveButton]}
                            onPress={handleLeaveForum}
                            disabled={joiningLeaving}
                        >
                            {joiningLeaving ? (
                                <ActivityIndicator color="#DC2626" />
                            ) : (
                                <>
                                    <Icon name="exit-to-app" size={20} color="#DC2626" />
                                    <Text style={[styles.actionButtonText, styles.leaveButtonText]}>Quitter</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {!isMember ? (
                    <View style={styles.joinPromptContainer}>
                        <Icon name="lock-outline" size={48} color="#6B7280" />
                        <Text style={styles.joinPromptTitle}>
                            Rejoignez ce forum pour participer
                        </Text>
                        <Text style={styles.joinPromptText}>
                            Vous devez être membre de ce forum pour voir les discussions et participer
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.sortButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.sortButton,
                                    styles.sortButtonActive
                                ]}
                                onPress={() => setSortBy('recent')}
                            >
                                <Text style={[
                                    styles.sortButtonText,
                                    styles.sortButtonTextActive
                                ]}>Discussions</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.postsList}>
                            {posts.length === 0 ? (
                                <View style={styles.noPostsContainer}>
                                    <Icon name="message-outline" size={48} color="#6B7280" />
                                    <Text style={styles.noPostsText}>
                                        Aucun message dans ce forum
                                    </Text>
                                    <Text style={styles.noPostsSubtext}>
                                        Soyez le premier à partager quelque chose!
                                    </Text>
                                </View>
                            ) : (
                                sortedPosts.map((post) => (
                                    <ForumPostCard
                                        key={post.id}
                                        post={post}
                                        onPress={(post) => console.log('Post clicked:', post.id)}
                                        onLike={(post) => console.log('Like post:', post.id)}
                                    />
                                ))
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            {isMember && (
                <FAB
                    icon="send"
                    label="Nouveau message"
                    style={styles.fab}
                    onPress={() => {
                        console.log('Create new post');
                    }}
                    color="#FFFFFF"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        flex: 1,
    },
    memberBadge: {
        backgroundColor: '#2D5016',
        padding: 6,
        borderRadius: 20,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    stats: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
        marginTop: 4,
    },
    joinButton: {
        backgroundColor: '#2D5016',
    },
    leaveButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    leaveButtonText: {
        color: '#DC2626',
    },
    joinPromptContainer: {
        padding: 48,
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#FFFFFF',
        marginTop: 8,
    },
    joinPromptTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
    },
    joinPromptText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    sortButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#F3F4F6',
    },
    sortButtonActive: {
        backgroundColor: '#E5E7EB',
    },
    sortButtonText: {
        fontSize: 14,
        color: '#6B7280',
    },
    sortButtonTextActive: {
        color: '#1F2937',
        fontWeight: '600',
    },
    postsList: {
        padding: 16,
        gap: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#2D5016',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    noPostsContainer: {
        padding: 48,
        alignItems: 'center',
        gap: 12,
    },
    noPostsText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4B5563',
        textAlign: 'center',
    },
    noPostsSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#2D5016',
    },
});