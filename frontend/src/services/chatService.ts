import { getStoredToken } from '../utils/authStorage';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ChatResponse {
  text: string;
  suggestedActions?: string[];
}

export class ChatService {
  private static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  static async sendMessage(message: string): Promise<ChatResponse> {
    try {
      // Use the configured API URL
      const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.100.213.57:3000') + '/api';

      const token = await getStoredToken();

      const response = await fetch(`${API_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          language: 'en' // Default to English
        })
      });

      if (!response.ok) {
        // If API fails (e.g. backend not running), throw to trigger fallback
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get response');
      }

      return {
        text: data.data.text,
        suggestedActions: data.data.suggestions
      };
    } catch (error) {
      console.error('Error sending message:', error);

      // Fallback for demo/offline mode or when backend is unreachable
      // This ensures the UI doesn't break during testing
      return {
        text: "I'm having trouble connecting to the server. Please check your internet connection.",
        suggestedActions: ["Try again"]
      };
    }
  }

  static createMessage(text: string, sender: 'user' | 'ai'): Message {
    return {
      id: this.generateId(),
      text,
      sender,
      timestamp: new Date()
    };
  }
}