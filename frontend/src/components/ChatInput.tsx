import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ChatInputProps {
    onSend: (message: string) => void;
    onStartVoice: () => void;
    onStopVoice: () => void;
    isRecording: boolean;
    isLoading?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
    onSend, 
    onStartVoice, 
    onStopVoice, 
    isRecording, 
    isLoading 
}) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Tapez votre message..."
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                editable={!isRecording}
            />
            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={isRecording ? onStopVoice : onStartVoice}
                    style={[styles.iconButton, isRecording && styles.recording]}
                >
                    <Icon
                        name={isRecording ? "stop-circle" : "microphone"}
                        size={24}
                        color={isRecording ? "#fff" : "#2D5016"}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!message.trim() || isLoading}
                    style={[
                        styles.sendButton,
                        (!message.trim() || isLoading) && styles.sendButtonDisabled
                    ]}
                >
                    <Icon
                        name="send"
                        size={20}
                        color={message.trim() && !isLoading ? "#fff" : "#A1A1AA"}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 8,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 12 : 8,
        paddingBottom: Platform.OS === 'ios' ? 12 : 8,
        fontSize: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recording: {
        backgroundColor: '#EF4444',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2D5016',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#F9FAFB',
    },
});