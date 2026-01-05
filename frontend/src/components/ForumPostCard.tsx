import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ForumPost } from '../types/forum';

interface ForumPostCardProps {
    post: ForumPost;
    onPress: (post: ForumPost) => void;
    onLike?: (post: ForumPost) => void;
}

export const ForumPostCard: React.FC<ForumPostCardProps> = ({ 
    post, 
    onPress,
    onLike 
}) => {
    return (
        <TouchableOpacity 
            style={styles.container}
            onPress={() => onPress(post)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.author}>
                    <Text style={styles.authorName}>{post.authorName}</Text>
                    <View style={styles.roleTag}>
                        <Text style={styles.roleText}>{post.authorRole}</Text>
                    </View>
                </View>
                <Text style={styles.date}>
                    {new Date((post as any).created_at || post.createdAt).toLocaleDateString('fr-FR')}
                </Text>
            </View>

            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.content} numberOfLines={3}>
                {post.content}
            </Text>

            {post.images && post.images.length > 0 && (
                <View style={styles.imageContainer}>
                    <Image 
                        source={{ uri: post.images[0] }} 
                        style={styles.image}
                        resizeMode="cover"
                    />
                    {post.images.length > 1 && (
                        <View style={styles.imageOverlay}>
                            <Text style={styles.imageCount}>+{post.images.length - 1}</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.footer}>
                <View style={styles.tags}>
                    {post.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => onLike?.(post)}
                    >
                        <Icon name="thumb-up-outline" size={18} color="#6B7280" />
                        <Text style={styles.actionText}>{post.likesCount}</Text>
                    </TouchableOpacity>
                    <View style={styles.actionButton}>
                        <Icon name="comment-outline" size={18} color="#6B7280" />
                        <Text style={styles.actionText}>{post.commentsCount}</Text>
                    </View>
                </View>
            </View>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    author: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    authorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    roleTag: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    roleText: {
        color: '#4B5563',
        fontSize: 12,
        textTransform: 'capitalize',
    },
    date: {
        color: '#6B7280',
        fontSize: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        color: '#4B5563',
        fontSize: 14,
        lineHeight: 20,
    },
    imageContainer: {
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 8,
        borderTopLeftRadius: 8,
    },
    imageCount: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    tags: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
        flexWrap: 'wrap',
    },
    tag: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
    },
    tagText: {
        color: '#4B5563',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        color: '#6B7280',
        fontSize: 14,
    },
});