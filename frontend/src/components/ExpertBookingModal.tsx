import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

interface ExpertBookingModalProps {
    visible: boolean;
    expert: {
        id: string;
        name: string;
        hourlyRate: number;
    };
    onClose: () => void;
    onBookingComplete: () => void;
}

export default function ExpertBookingModal({
    visible,
    expert,
    onClose,
    onBookingComplete
}: ExpertBookingModalProps) {
    const [loading, setLoading] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [duration, setDuration] = useState(60); // minutes
    const [problemDescription, setProblemDescription] = useState('');
    const [consultationType, setConsultationType] = useState<'remote' | 'on_site'>('remote');
    const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'orange'>('mtn');
    const [phoneNumber, setPhoneNumber] = useState('');

    const totalCost = (expert.hourlyRate / 60) * duration;

    const handleBooking = async () => {
        if (!scheduledDate || !problemDescription.trim() || !phoneNumber.trim()) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        try {
            setLoading(true);

            // Import api
            const { api } = await import('../services/api');

            // Book consultation with payment
            const response = await api.consultations.bookWithPayment({
                expertId: expert.id,
                problemDescription,
                consultationType,
                scheduledDate,
                duration,
                paymentMethod,
                phoneNumber,
                totalCost
            });

            Alert.alert('Success', 'Booking created! Payment processing...');
            onBookingComplete();
            onClose();
        } catch (error: any) {
            console.error('Booking error:', error);
            Alert.alert('Error', error.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Book Consultation</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        <Text style={styles.expertName}>{expert.name}</Text>

                        <Text style={styles.label}>Scheduled Date & Time *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD HH:MM (e.g., 2024-12-10 14:00)"
                            value={scheduledDate}
                            onChangeText={setScheduledDate}
                        />

                        <Text style={styles.label}>Duration: {duration} minutes</Text>
                        <View style={styles.durationButtons}>
                            {[30, 60, 90, 120, 180].map((mins) => (
                                <TouchableOpacity
                                    key={mins}
                                    style={[styles.durationButton, duration === mins && styles.durationButtonActive]}
                                    onPress={() => setDuration(mins)}
                                >
                                    <Text style={[styles.durationText, duration === mins && styles.durationTextActive]}>
                                        {mins}m
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Consultation Type</Text>
                        <View style={styles.typeButtons}>
                            <TouchableOpacity
                                style={[styles.typeButton, consultationType === 'remote' && styles.typeButtonActive]}
                                onPress={() => setConsultationType('remote')}
                            >
                                <MaterialCommunityIcons
                                    name="video"
                                    size={20}
                                    color={consultationType === 'remote' ? '#FFF' : theme.colors.primary}
                                />
                                <Text style={[styles.typeText, consultationType === 'remote' && styles.typeTextActive]}>
                                    Remote
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, consultationType === 'on_site' && styles.typeButtonActive]}
                                onPress={() => setConsultationType('on_site')}
                            >
                                <MaterialCommunityIcons
                                    name="map-marker"
                                    size={20}
                                    color={consultationType === 'on_site' ? '#FFF' : theme.colors.primary}
                                />
                                <Text style={[styles.typeText, consultationType === 'on_site' && styles.typeTextActive]}>
                                    On-site
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Describe Your Issue *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="What problem do you need help with?"
                            value={problemDescription}
                            onChangeText={setProblemDescription}
                            multiline
                            numberOfLines={4}
                        />

                        <Text style={styles.label}>Payment Method</Text>
                        <View style={styles.paymentButtons}>
                            <TouchableOpacity
                                style={[styles.paymentButton, paymentMethod === 'mtn' && styles.paymentButtonActive]}
                                onPress={() => setPaymentMethod('mtn')}
                            >
                                <Text style={[styles.paymentText, paymentMethod === 'mtn' && styles.paymentTextActive]}>
                                    MTN
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.paymentButton, paymentMethod === 'orange' && styles.paymentButtonActive]}
                                onPress={() => setPaymentMethod('orange')}
                            >
                                <Text style={[styles.paymentText, paymentMethod === 'orange' && styles.paymentTextActive]}>
                                    Orange
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Phone Number *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+237 6XX XXX XXX"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />

                        <View style={styles.feeBox}>
                            <Text style={styles.feeLabel}>Consultation Fee:</Text>
                            <Text style={styles.feeValue}>{totalCost.toLocaleString('en-US')} XAF</Text>
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.bookButton, loading && styles.bookButtonDisabled]}
                        onPress={handleBooking}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.bookButtonText}>Book & Pay</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modal: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%'
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
        padding: 16
    },
    expertName: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.primary,
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        marginTop: 12
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FFF'
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top'
    },
    durationButtons: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12
    },
    durationButton: {
        flex: 1,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        alignItems: 'center'
    },
    durationButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary
    },
    durationText: {
        fontSize: 14,
        color: '#666'
    },
    durationTextActive: {
        color: '#FFF',
        fontWeight: '600'
    },
    typeButtons: {
        flexDirection: 'row',
        gap: 12
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 8,
        gap: 8
    },
    typeButtonActive: {
        backgroundColor: theme.colors.primary
    },
    typeText: {
        fontSize: 14,
        color: theme.colors.primary
    },
    typeTextActive: {
        color: '#FFF',
        fontWeight: '600'
    },
    paymentButtons: {
        flexDirection: 'row',
        gap: 12
    },
    paymentButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        alignItems: 'center'
    },
    paymentButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary
    },
    paymentText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600'
    },
    paymentTextActive: {
        color: '#FFF'
    },
    feeBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        marginTop: 16
    },
    feeLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text
    },
    feeValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.primary
    },
    bookButton: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        margin: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    bookButtonDisabled: {
        opacity: 0.6
    },
    bookButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
