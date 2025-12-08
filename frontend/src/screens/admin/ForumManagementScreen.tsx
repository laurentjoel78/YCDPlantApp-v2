import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, IconButton, Menu, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import { cacheService, CACHE_KEYS } from '../../services/cacheService';

const ForumManagementScreen = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const { subscribe } = useSocket();
    // Use cached forums to avoid loading spinner on return visits
    const cachedTopics = cacheService.get<any[]>(CACHE_KEYS.ADMIN_FORUMS);
    const [loading, setLoading] = useState(!cachedTopics);
    const [topics, setTopics] = useState<any[]>(cachedTopics || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuVisible, setMenuVisible] = useState<string | null>(null);

    const fetchTopics = useCallback(async () => {
        if (!token) {
            Alert.alert('Error', 'Authentication required');
            return;
        }
        try {
            if (topics.length === 0) setLoading(true);
            const response = await adminService.getForumTopics(token);
            const topicsList = response.topics || response || [];
            setTopics(topicsList);
            cacheService.set(CACHE_KEYS.ADMIN_FORUMS, topicsList);
        } catch (error) {
            console.error('Error fetching topics:', error);
            Alert.alert('Error', 'Failed to load forum topics');
        } finally {
            setLoading(false);
        }
    }, [token, topics.length]);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    // Listen for real-time forum updates
    useEffect(() => {
        const events = ['FORUM_TOPIC_CREATE', 'FORUM_POST_CREATE'];
        const unsubscribers = events.map(event =>
            subscribe(event, () => {
                cacheService.invalidate(CACHE_KEYS.ADMIN_FORUMS);
                fetchTopics();
            })
        );
        return () => unsubscribers.forEach(unsub => unsub());
    }, [subscribe, fetchTopics]);

    const renderTopicCard = ({ item }: { item: any }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text variant="titleMedium" style={styles.title}>{item.title}</Text>
                        <Text variant="bodySmall" numberOfLines={2} style={styles.description}>
                            {item.description}
                        </Text>
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
                        <Menu.Item onPress={() => { }} title="Edit Topic" leadingIcon="pencil" />
                        <Divider />
                        <Menu.Item
                            onPress={() => { }}
                            title="Delete Topic"
                            leadingIcon="delete"
                            titleStyle={{ color: 'red' }}
                        />
                    </Menu>
                </View>

                <View style={styles.meta}>
                    <Chip icon="tag" style={styles.chip} compact>{item.category}</Chip>
                    {item.location && (
                        <Chip icon="map-marker" style={styles.chip} compact>
                            {item.location.city || 'Location Based'}
                        </Chip>
                    )}
                </View>

                <View style={styles.stats}>
                    <Text variant="bodySmall" style={styles.statText}>
                        {item.views || 0} views â€¢ {item.postsCount || 0} posts
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Loading forums...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Search forums..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            <FlatList
                data={topics.filter(t => {
                    const title = (t?.title || '').toLowerCase();
                    const description = (t?.description || '').toLowerCase();
                    const query = searchQuery.toLowerCase();
                    return title.includes(query) || description.includes(query);
                })}
                renderItem={renderTopicCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center' as const, padding: 32 }}>
                        <Text>No forums found</Text>
                    </View>
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                // @ts-ignore - Navigation types will be updated
                onPress={() => navigation.navigate('CreateForum')}
                label="New Forum"
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
    titleContainer: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        color: '#666',
    },
    meta: {
        flexDirection: 'row',
        marginTop: 12,
        flexWrap: 'wrap',
    },
    chip: {
        marginRight: 8,
        marginBottom: 4,
        backgroundColor: '#e8f5e9',
    },
    stats: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    statText: {
        color: '#888',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#2E7D32',
    },
});

export default ForumManagementScreen;
