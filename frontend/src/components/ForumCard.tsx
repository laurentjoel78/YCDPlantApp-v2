import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ForumCategory } from '../types/forum';

interface ForumCardProps {
    category: ForumCategory;
    onPress: (category: ForumCategory) => void;
    onJoinPress?: (category: ForumCategory) => void;
}

export const ForumCard: React.FC<ForumCardProps> = ({ category, onPress, onJoinPress }) => {
    const displayTitle = category.title || category.name;
    const memberCount = category.memberCount || 0;
    const isMember = category.isMember || false;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress(category)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Icon name="forum" size={24} color="#2D5016" style={styles.forumIcon} />
                    <Text style={styles.title} numberOfLines={1}>{displayTitle}</Text>
                </View>
                {isMember && (
                    <View style={styles.memberBadge}>
                        <Icon name="check-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.memberBadgeText}>Membre</Text>
                    </View>
                )}
            </View>

            {category.description && (
                <Text style={styles.description} numberOfLines={2}>{category.description}</Text>
            )}

            <View style={styles.footer}>
                <View style={styles.stats}>
                    <View style={styles.statItem}>
                        <Icon name="account-group" size={16} color="#6B7280" />
                        <Text style={styles.statsText}>{memberCount} membres</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Icon name="message" size={16} color="#6B7280" />
                        <Text style={styles.statsText}>{category.postsCount || 0} messages</Text>
                    </View>
                </View>

                <View style={styles.region}>
                    <Icon name="map-marker" size={16} color="#2D5016" />
                    <Text style={styles.regionText}>{category.region}</Text>
                </View>
            </View>

            {!isMember && onJoinPress && (
                <TouchableOpacity
                    style={styles.joinButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        onJoinPress(category);
                    }}
                    activeOpacity={0.8}
                >
                    <Icon name="account-plus" size={18} color="#FFFFFF" />
                    <Text style={styles.joinButtonText}>Rejoindre</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    forumIcon: {
        flexShrink: 0,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D5016',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    memberBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        color: '#6B7280',
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    stats: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statsText: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '500',
    },
    region: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    regionText: {
        color: '#2D5016',
        fontSize: 14,
        fontWeight: '600',
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2D5016',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
        marginTop: 4,
    },
    joinButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});