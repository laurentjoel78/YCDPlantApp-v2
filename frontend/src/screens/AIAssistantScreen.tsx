import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Text, TextInput, ActivityIndicator, Chip, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatService, Message } from '../services/chatService';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';
import { useVoiceRecognition, VoiceLanguage } from '../hooks/useVoiceRecognition';

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('fr-FR');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { t, i18n } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const {
    isRecording,
    isProcessing,
    recordingDuration,
    error: voiceError,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
  } = useVoiceRecognition();

  // Pulse animation for recording indicator
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRecording, pulseAnim]);

  // Add initial greeting message
  useEffect(() => {
    const welcomeMessage = ChatService.createMessage(
      t('expert.chat.welcome', "Hello! I'm your AI farming assistant. How can I help you today?"),
      'ai'
    );
    setMessages([welcomeMessage]);
    setSuggestedActions([
      t('chat.suggestions.weather', "How's the weather today?"),
      t('chat.suggestions.disease', "Check my crops for diseases"),
      t('chat.suggestions.practices', "Best farming practices"),
      t('chat.suggestions.prices', "Market prices")
    ]);
  }, [t]);

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
      // TODO: Pass current language code to API if needed (e.g. i18n.language)
      const response = await api.chatbot.sendMessage(inputText.trim(), 'en');
      const aiMessage = ChatService.createMessage(response.data.text, 'ai');
      setMessages(prev => [...prev, aiMessage]);
      setSuggestedActions(response.data.suggestions || []);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = ChatService.createMessage(
        t('expert.chat.error', 'Sorry, I encountered an error connecting to the AI. Please try again.'),
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
            <Text style={styles.loadingText}>{t('common.loading', 'AI is thinking...')}</Text>
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

      {/* Voice Error Display */}
      {voiceError && (
        <View style={styles.voiceErrorContainer}>
          <Text style={styles.voiceErrorText}>{voiceError}</Text>
          <TouchableOpacity onPress={clearError}>
            <MaterialCommunityIcons name="close" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.recordingText}>
            {t('voice.recording', 'Recording...')} {recordingDuration}s
          </Text>
          <TouchableOpacity onPress={cancelRecording} style={styles.cancelRecordingButton}>
            <MaterialCommunityIcons name="close" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingIndicator}>
          <ActivityIndicator size="small" color="#2D5016" />
          <Text style={styles.processingText}>{t('voice.processing', 'Transcribing...')}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        {/* Language Selector */}
        <Menu
          visible={showLanguageMenu}
          onDismiss={() => setShowLanguageMenu(false)}
          anchor={
            <TouchableOpacity 
              onPress={() => setShowLanguageMenu(true)}
              style={styles.languageButton}
            >
              <Text style={styles.languageButtonText}>
                {voiceLanguage === 'fr-FR' ? 'FR' : 'EN'}
              </Text>
            </TouchableOpacity>
          }
        >
          <Menu.Item 
            onPress={() => { setVoiceLanguage('fr-FR'); setShowLanguageMenu(false); }} 
            title="🇫🇷 Français" 
          />
          <Menu.Item 
            onPress={() => { setVoiceLanguage('en-US'); setShowLanguageMenu(false); }} 
            title="🇺🇸 English" 
          />
        </Menu>

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={isRecording 
            ? t('voice.speakNow', 'Speak now...') 
            : t('forum.chat.placeholder', "Type your message...")}
          style={styles.input}
          multiline
          maxLength={500}
          textColor="#000000"
          placeholderTextColor="#666666"
          editable={!isRecording && !isProcessing}
        />

        {/* Voice Button */}
        <TouchableOpacity
          onPress={async () => {
            if (isRecording) {
              const transcription = await stopRecording(voiceLanguage);
              if (transcription) {
                setInputText(prev => prev ? `${prev} ${transcription}` : transcription);
              }
            } else {
              await startRecording();
            }
          }}
          style={[
            styles.voiceButton,
            isRecording && styles.voiceButtonRecording,
          ]}
          disabled={isProcessing || isLoading}
        >
          <MaterialCommunityIcons
            name={isRecording ? 'stop' : 'microphone'}
            size={24}
            color={isRecording ? '#FFFFFF' : '#2D5016'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          disabled={!inputText.trim() || isLoading || isRecording || isProcessing}
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
  voiceButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  voiceButtonRecording: {
    backgroundColor: '#DC2626',
  },
  languageButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  languageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D5016',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    marginRight: 8,
  },
  recordingText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  cancelRecordingButton: {
    padding: 4,
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  processingText: {
    color: '#2D5016',
    fontSize: 14,
    marginLeft: 8,
  },
  voiceErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  voiceErrorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
});