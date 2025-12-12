import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Card,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { ExpertService, ConsultationMessage, Expert } from '../services/expertService';
import * as ImagePicker from 'expo-image-picker';

type ConsultationChatParams = {
  consultationId: string;
  expert: Expert;
};

type ConsultationChatScreenRouteProp = RouteProp<
  { ConsultationChat: ConsultationChatParams },
  'ConsultationChat'
>;

export default function ConsultationChatScreen() {
  const route = useRoute<ConsultationChatScreenRouteProp>();
  const navigation = useNavigation();
  const { consultationId, expert } = route.params;
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    navigation.setOptions({
      title: `Chat with ${expert.name}`,
    });
  }, [navigation, expert]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      setIsLoading(true);
      const message = await ExpertService.sendMessage(consultationId, inputText);
      setMessages(prev => [...prev, message]);
      setInputText('');

      // Mock expert response
      setTimeout(async () => {
        const expertResponse = await ExpertService.sendMessage(
          consultationId,
          "Thank you for your message. I'll analyze your situation and provide advice shortly."
        );
        setMessages(prev => [...prev, { ...expertResponse, sender: 'expert' }]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleAttachment = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const message = await ExpertService.sendMessage(
          consultationId,
          'Attached image for reference',
          [{
            type: 'image',
            url: result.assets[0].uri,
            name: 'Image attachment',
          }],
        );
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      console.error('Error attaching image:', error);
    }
  };

  const renderMessage = (message: ConsultationMessage) => {
    const isExpert = message.sender === 'expert';
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isExpert ? styles.expertMessage : styles.userMessage,
        ]}
      >
        <View style={[
          styles.messageBubble,
          isExpert ? styles.expertBubble : styles.userBubble,
        ]}>
          {message.attachments?.map((attachment, index) => (
            <Card key={index} style={styles.attachmentCard}>
              <Card.Cover source={{ uri: attachment.url }} />
            </Card>
          ))}
          <Text style={[
            styles.messageText,
            isExpert ? styles.expertText : styles.userText,
          ]}>
            {message.text}
          </Text>
          <Text style={[
            styles.timestamp,
            isExpert ? styles.expertTimestamp : styles.userTimestamp,
          ]}>
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            <Text style={styles.loadingText}>Expert is typing...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <IconButton
          icon="paperclip"
          size={24}
          onPress={handleAttachment}
          style={styles.attachButton}
        />
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
  },
  expertMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  expertBubble: {
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
  },
  expertText: {
    color: '#1F2937',
  },
  userText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  expertTimestamp: {
    color: '#6B7280',
  },
  userTimestamp: {
    color: '#E5E7EB',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachButton: {
    marginRight: 8,
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
  attachmentCard: {
    marginBottom: 8,
  },
});