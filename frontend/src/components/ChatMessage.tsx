import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type MessageType = 'user' | 'bot' | 'system';

export interface ChatMessageProps {
    message: string;
    type: MessageType;
    timestamp: Date;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, type, timestamp }) => {
    const isUser = type === 'user';
    const isSystem = type === 'system';

    return (
        <View style={[
            styles.container,
            isUser ? styles.userContainer : isSystem ? styles.systemContainer : styles.botContainer
        ]}>
            <Text style={[
                styles.message,
                isUser ? styles.userMessage : isSystem ? styles.systemMessage : styles.botMessage
            ]}>
                {message}
            </Text>
            <Text style={[
                styles.timestamp,
                isUser ? styles.userTimestamp : styles.botTimestamp
            ]}>
                {formatTime(timestamp)}
            </Text>
        </View>
    );
};

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const styles = StyleSheet.create({
    container: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 4,
    },
    userContainer: {
        backgroundColor: '#2D5016',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    botContainer: {
        backgroundColor: '#F3F4F6',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    systemContainer: {
        backgroundColor: '#FEF3C7',
        alignSelf: 'center',
        borderRadius: 8,
        marginVertical: 8,
    },
    message: {
        fontSize: 15,
        lineHeight: 20,
    },
    userMessage: {
        color: '#fff',
    },
    botMessage: {
        color: '#1F2937',
    },
    systemMessage: {
        color: '#92400E',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    timestamp: {
        fontSize: 11,
        marginTop: 4,
    },
    userTimestamp: {
        color: '#E5E7EB',
        textAlign: 'right',
    },
    botTimestamp: {
        color: '#6B7280',
    },
});