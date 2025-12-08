import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

type RouteParams = {
    PaymentModal: {
        payment: {
            reference: string;
            status: string;
            instructions?: {
                title: string;
                steps: string[];
                note: string;
            };
        };
        order: {
            id: string;
            total: number;
        };
    };
};

export default function PaymentModalScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RouteParams, 'PaymentModal'>>();
    const { payment, order } = route.params;

    const [verifying, setVerifying] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 30; // 30 * 2 = 60 seconds max

    useEffect(() => {
        // Auto-verify after 5 seconds (mock payment auto-completes)
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    verifyPayment();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const verifyPayment = async () => {
        if (retryCount >= MAX_RETRIES) {
            console.log('Max retries reached');
            setVerifying(false);
            return;
        }

        setVerifying(true);
        try {
            const response = await api.checkout.verifyPayment(order.id, payment.reference);

            if (response.success) {
                // Payment confirmed!
                navigation.replace('OrderSuccess', { order: response.data.order });
            } else {
                // Payment still pending, retry
                setRetryCount(prev => prev + 1);
                setTimeout(verifyPayment, 2000);
            }
        } catch (error: any) {
            console.error('Payment verification error:', error);

            // Only retry if not a 400/404 error
            if (!error.message?.includes('400') && !error.message?.includes('404')) {
                setRetryCount(prev => prev + 1);
                setTimeout(verifyPayment, 2000);
            } else {
                setVerifying(false);
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.modal}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="cellphone-check" size={60} color={theme.colors.primary} />
                    <Text style={styles.title}>
                        {payment.instructions?.title || 'Complete Payment'}
                    </Text>
                </View>

                {payment.instructions && (
                    <View style={styles.instructions}>
                        {payment.instructions.steps.map((step, index) => (
                            <View key={index} style={styles.step}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                                </View>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {payment.instructions?.note && (
                    <View style={styles.noteBox}>
                        <MaterialCommunityIcons name="information" size={20} color={theme.colors.primary} />
                        <Text style={styles.noteText}>{payment.instructions.note}</Text>
                    </View>
                )}

                <View style={styles.verifyingSection}>
                    {verifying ? (
                        <>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={styles.verifyingText}>Verifying payment...</Text>
                        </>
                    ) : (
                        <>
                            <View style={styles.countdownCircle}>
                                <Text style={styles.countdownText}>{countdown}</Text>
                            </View>
                            <Text style={styles.waitingText}>
                                Auto-verifying in {countdown} second{countdown !== 1 ? 's' : ''}...
                            </Text>
                        </>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.manualButton}
                    onPress={verifyPayment}
                    disabled={verifying}
                >
                    <Text style={styles.manualButtonText}>Verify Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modal: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400
    },
    header: {
        alignItems: 'center',
        marginBottom: 24
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 12,
        textAlign: 'center'
    },
    instructions: {
        marginBottom: 20
    },
    step: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    stepNumberText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold'
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text,
        lineHeight: 20
    },
    noteBox: {
        flexDirection: 'row',
        backgroundColor: '#E8F4FD',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20
    },
    noteText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: '600'
    },
    verifyingSection: {
        alignItems: 'center',
        padding: 20
    },
    verifyingText: {
        marginTop: 12,
        fontSize: 16,
        color: theme.colors.text
    },
    countdownCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    countdownText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF'
    },
    waitingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666'
    },
    manualButton: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12
    },
    manualButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    cancelButton: {
        padding: 12,
        alignItems: 'center'
    },
    cancelButtonText: {
        color: '#999',
        fontSize: 14
    }
});
