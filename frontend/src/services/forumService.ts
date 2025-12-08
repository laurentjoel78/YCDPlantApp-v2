import { ForumPost, ForumCategory, ForumComment } from '../types/forum';
import { api } from './api';

interface ForumTopicResponse {
  topic: ForumCategory;
  posts: ForumPost[];
  total: number;
  page: number;
  totalPages: number;
}

export const forumService = {
  // Get list of forum categories/topics
  async getForumCategories(): Promise<ForumCategory[]> {
    try {
      const response = await api.forums.getTopics();
      return response.data.topics;
    } catch (error) {
      console.error('Failed to fetch forum categories:', error);
      throw error;
    }
  },

  // Get a single forum topic with its posts
  async getForumTopic(topicId: string, page: number = 1): Promise<ForumTopicResponse> {
    try {
      const response = await api.forums.getTopic(topicId, page);
      // Backend returns the topic directly with posts as a property
      const topicData = response.data as any;
      const result: ForumTopicResponse = {
        topic: topicData,
        posts: topicData.posts || [],
        total: topicData.posts?.length || 0,
        page: page,
        totalPages: 1
      };
      return result;
    } catch (error) {
      console.error('Failed to fetch forum topic:', error);
      throw error;
    }
  },

  // Create a new forum topic
  async createTopic(data: {
    title: string;
    description: string;
    category: string;
    region?: string;
    tags?: string[];
    location?: { latitude: number; longitude: number };
  }): Promise<ForumCategory> {
    try {
      const response = await api.forums.createTopic(data);
      return response.data;
    } catch (error) {
      console.error('Failed to create forum topic:', error);
      throw error;
    }
  },

  // Create a new post in a topic
  async createPost(data: {
    topicId: string;
    content: string;
    title: string;
    tags?: string[];
    images?: string[];
  }): Promise<ForumPost> {
    try {
      const response = await api.forums.createPost(data);
      return response.data;
    } catch (error) {
      console.error('Failed to create forum post:', error);
      throw error;
    }
  },

  // Report inappropriate content
  async reportContent(data: {
    contentId: string;
    contentType: 'post' | 'comment';
    reason: string;
    details?: string;
  }): Promise<void> {
    try {
      await api.forums.report(data);
    } catch (error) {
      console.error('Failed to report content:', error);
      throw error;
    }
  },

  // Search forum topics
  async searchTopics(params: {
    search?: string;
    category?: string;
    region?: string;
    tags?: string[];
    page?: number;
  }): Promise<{
    topics: ForumCategory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await api.forums.search(params);
      return response.data;
    } catch (error) {
      console.error('Failed to search topics:', error);
      throw error;
    }
  },

  // Membership methods
  async joinForum(forumId: string): Promise<any> {
    try {
      const response = await api.forums.joinForum(forumId);
      return response.data;
    } catch (error) {
      console.error('Failed to join forum:', error);
      throw error;
    }
  },

  async leaveForum(forumId: string): Promise<void> {
    try {
      await api.forums.leaveForum(forumId);
    } catch (error) {
      console.error('Failed to leave forum:', error);
      throw error;
    }
  },

  async getForumMembers(forumId: string): Promise<any[]> {
    try {
      const response = await api.forums.getMembers(forumId);
      return response.data;
    } catch (error) {
      console.error('Failed to get forum members:', error);
      throw error;
    }
  }
};