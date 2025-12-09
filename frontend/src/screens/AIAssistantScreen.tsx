import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatService, Message } from '../services/chatService';
import { api } from '../services/api';

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Add initial greeting message
  useEffect(() => {
    const welcomeMessage = ChatService.createMessage(
      "Hello! I'm your AI farming assistant. How can I help you today?",
      'ai'
    );
    setMessages([welcomeMessage]);
    setSuggestedActions([
      "How's the weather today?",
      "Check my crops for diseases",
      "Best farming practices",
      "Market prices"
    ]);
  }, []);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = ChatService.createMessage(inputText.trim(), 'user');
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setSuggestedActions([]);

    try {
      // Use the real backend API
      const response = await api.chatbot.sendMessage(inputText.trim(), 'en');
      const aiMessage = ChatService.createMessage(response.data.text, 'ai');
      setMessages(prev => [...prev, aiMessage]);
      setSuggestedActions(response.data.suggestions || []);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = ChatService.createMessage(
        'Sorry, I encountered an error connecting to the AI. Please try again.',
        'ai'
      );
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInputText(action);
  };

  const renderMessage = (message: Message) => {
    const isAI = message.sender === 'ai';
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isAI ? styles.aiMessage : styles.userMessage,
        ]}
      >
        {isAI && (
          <MaterialCommunityIcons
            name="robot"
            size={24}
            color="#2D5016"
            style={styles.avatar}
          />
        )}
        <View style={[styles.messageBubble, isAI ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.messageText, !isAI && { color: '#FFFFFF' }]}>
            {message.text}
          </Text>
          <Text style={[styles.timestamp, !isAI && { color: '#E5E7EB' }]}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2D5016" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {suggestedActions.length > 0 && !isLoading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestedActionsContainer}
          contentContainerStyle={styles.suggestedActionsContent}
        >
          {suggestedActions.map((action, index) => (
            <Chip
              key={index}
              onPress={() => handleSuggestedAction(action)}
              style={styles.suggestionChip}
              textStyle={styles.suggestionText}
            >
              {action}
            </Chip>
          ))}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          style={styles.input}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          disabled={!inputText.trim() || isLoading}
        >
          <MaterialCommunityIcons
            name="send"
            size={24}
            color={!inputText.trim() || isLoading ? '#9CA3AF' : '#2D5016'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  avatar: {
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  aiBubble: {
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#2D5016',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    padding: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#2D5016',
    fontSize: 14,
  },
  suggestedActionsContainer: {
    maxHeight: 56,
    marginBottom: 8,
  },
  suggestedActionsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  suggestionText: {
    color: '#2D5016',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});