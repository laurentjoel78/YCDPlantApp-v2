import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

interface RatingModalProps {
    visible: boolean;
    consultation: {
        id: string;
        expertName: string;
    };
    onClose: () => void;
    onRatingSubmit: (rating: number, feedback: string) => Promise<void>;
}

export default function RatingModal({
    visible,
    consultation,
    onClose,
    onRatingSubmit
}: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return;
        }

        try {
            setLoading(true);
            await onRatingSubmit(rating, feedback);
            Alert.alert('Success', 'Thank you for your rating!');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to submit rating');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Rate Consultation</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.expertName}>{consultation.expertName}</Text>

                        <Text style={styles.ratingLabel}>How was your experience?</Text>
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    style={styles.starButton}
                                >
                                    <MaterialCommunityIcons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={48}
                                        color={star <= rating ? '#FFD700' : '#DDD'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {rating > 0 && (
                            <Text style={styles.ratingText}>
                                {rating === 1 && '😞 Poor'}
                                {rating === 2 && '😕 Fair'}
                                {rating === 3 && '😐 Good'}
                                {rating === 4 && '😊 Very Good'}
                                {rating === 5 && '🤩 Excellent'}
                            </Text>
                        )}

                        <Text style={styles.feedbackLabel}>Additional Feedback (Optional)</Text>
                        <TextInput
                            style={styles.feedbackInput}
                            placeholder="Share your thoughts..."
                            value={feedback}
                            onChangeText={setFeedback}
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                        />
                        <Text style={styles.charCount}>{feedback.length}/500</Text>

                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                                    <Text style={styles.submitButtonText}>Submit Rating</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modal: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    content: {
        padding: 20
    },
    expertName: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.primary,
        marginBottom: 20,
        textAlign: 'center'
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 16,
        textAlign: 'center'
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16
    },
    starButton: {
        padding: 4
    },
    ratingText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        color: theme.colors.primary
    },
    feedbackLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8
    },
    feedbackInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 4
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginBottom: 20
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    submitButtonDisabled: {
        opacity: 0.6
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
