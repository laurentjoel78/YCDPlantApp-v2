export interface ForumPost {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorRole: 'farmer' | 'expert' | 'admin';
    region: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    likesCount: number;
    commentsCount: number;
    tags: string[];
    images?: string[];
}

export interface ForumComment {
    id: string;
    postId: string;
    content: string;
    authorId: string;
    authorName: string;
    authorRole: 'farmer' | 'expert' | 'admin';
    createdAt: Date;
    updatedAt: Date;
    likesCount: number;
    parentCommentId?: string;
    images?: string[];
}

export interface ForumMember {
    id: string;
    userId: string;
    forumId: string;
    role: 'member' | 'moderator' | 'admin';
    joinedAt: Date;
    user: {
        id: string;
        first_name: string;
        last_name: string;
        profile_image_url?: string;
        region?: string;
    };
}

export interface ForumCategory {
    id: string;
    name: string;
    title?: string; // Same as name, for compatibility
    description: string;
    region: string;
    createdBy: string;
    createdAt: Date;
    postsCount: number;
    lastActivity?: Date;
    location?: {
        coordinates?: [number, number]; // [longitude, latitude]
        region?: string;
    };
    // Membership fields
    memberCount?: number;
    isMember?: boolean;
    members?: ForumMember[];
}

export interface ForumTopic {
    id: string;
    title: string;
    description: string;
    authorId: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    category: string;
    tags?: string[];
    createdAt: Date;
    lastActivityAt: Date;
    location?: {
        coordinates?: [number, number]; // [longitude, latitude]
        region?: string;
    };
    distance?: number; // in meters, only present when querying nearby topics
}