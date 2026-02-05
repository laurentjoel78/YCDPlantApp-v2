import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ForumCard } from '../components/ForumCard';
import { ForumCategory } from '../types/forum';
import { forumService } from '../services/forumService';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import { cacheService, CACHE_KEYS } from '../services/cacheService';
import { useTranslation } from 'react-i18next';

export default function ForumsScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { user } = useAuth();
    const { subscribe } = useSocket();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    // Use cached forums to avoid loading spinner on return visits
    const cachedForums = cacheService.get<ForumCategory[]>(CACHE_KEYS.FORUMS);
    const [forums, setForums] = useState<ForumCategory[]>(cachedForums || []);
    const [loading, setLoading] = useState(!cachedForums);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [joiningForumId, setJoiningForumId] = useState<string | null>(null);

    const fetchForums = useCallback(async () => {
        try {
            const regionToUse = user?.region || (user as any)?.location?.region;
            console.log('=== FORUM SEARCH DEBUG ===');
            console.log('Full user object:', JSON.stringify(user, null, 2));
            console.log('user?.region:', user?.region);
            console.log('(user as any)?.location?.region:', (user as any)?.location?.region);
            console.log('Region being sent to API:', regionToUse);
            console.log('=========================');

            const response = await forumService.searchTopics({
                search: searchQuery,
                region: regionToUse
            });
            setForums(response.topics);
            cacheService.set(CACHE_KEYS.FORUMS, response.topics); // Update cache
            setError(null);
        } catch (err) {
            setError('Failed to load forums. Please try again.');
            console.error('Failed to fetch forums:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery, user?.region]);

    useEffect(() => {
        fetchForums();
    }, [fetchForums]);

    // Listen for real-time forum updates
    useEffect(() => {
        const events = ['FORUM_TOPIC_CREATE', 'FORUM_POST_CREATE'];
        const unsubscribers = events.map(event =>
            subscribe(event, () => {
                cacheService.invalidate(CACHE_KEYS.FORUMS);
                fetchForums();
            })
        );
        return () => unsubscribers.forEach(unsub => unsub());
    }, [subscribe, fetchForums]);

    // Refetch forums when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchForums();
        });
        return unsubscribe;
    }, [navigation, fetchForums]);

    const onRefresh = async () => {
        setRefreshing(true);
        cacheService.invalidate(CACHE_KEYS.FORUMS);
        await fetchForums();
    };

    const handleJoinForum = async (forum: ForumCategory) => {
        try {
            setJoiningForumId(forum.id);
            await forumService.joinForum(forum.id);

            setForums(prev => prev.map(f =>
                f.id === forum.id
                    ? { ...f, isMember: true, memberCount: (f.memberCount || 0) + 1 }
                    : f
            ));

            Alert.alert(
                t('common.success', 'Success'),
                t('forum.joinedSuccess', { name: forum.name || forum.title }),
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            console.error('Failed to join forum:', error);
            Alert.alert(
                t('common.error', 'Error'),
                error.message || t('forum.joinError', 'Unable to join forum. Please try again.'),
                [{ text: 'OK' }]
            );
        } finally {
            setJoiningForumId(null);
        }
    };

    const filteredForums = forums.filter(forum => {
        const matchesSearch = (forum.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (forum.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <ScrollView
            style={styles.container}
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
                <Text style={styles.title}>{t('forum.title', 'Forums')} - {user?.region || t('forum.yourRegion', 'Your Region')}</Text>
                <Text style={styles.subtitle}>
                    {t('forum.subtitle', 'Connect with farmers in your region')}
                </Text>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Icon name="magnify" size={20} color="#6B7280" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('forum.searchPlaceholder', 'Search forums...')}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2D5016" />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={48} color="#DC2626" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchForums}
                    >
                        <Text style={styles.retryButtonText}>{t('common.retry', 'Retry')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.forumsList}>
                    {filteredForums.length === 0 ? (
                        <View style={styles.noResultsContainer}>
                            <Icon name="forum-outline" size={48} color="#6B7280" />
                            <Text style={styles.noResultsText}>
                                {t('forum.noForumsFound', 'No forums found in your region')}
                            </Text>
                            <Text style={styles.noResultsSubtext}>
                                {t('forum.regionSpecific', 'Forums are region-specific to facilitate local collaboration')}
                            </Text>
                        </View>
                    ) : (
                        filteredForums.map((forum) => (
                            <View key={forum.id} style={styles.forumCardWrapper}>
                                <ForumCard
                                    category={forum}
                                    onPress={(category) => {
                                        navigation.navigate('ForumDetails', {
                                            forumId: category.id,
                                            categoryName: category.name || category.title || 'Forum'
                                        });
                                    }}
                                    onJoinPress={handleJoinForum}
                                />
                                {joiningForumId === forum.id && (
                                    <View style={styles.joiningOverlay}>
                                        <ActivityIndicator color="#2D5016" />
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
            )}
        </ScrollView>
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
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        fontSize: 16,
        color: '#1F2937',
    },
    forumsList: {
        padding: 16,
        gap: 16,
    },
    forumCardWrapper: {
        position: 'relative',
    },
    joiningOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
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
        backgroundColor: '#2D5016',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    noResultsContainer: {
        alignItems: 'center',
        padding: 32,
        gap: 12,
    },
    noResultsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    noResultsSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
});