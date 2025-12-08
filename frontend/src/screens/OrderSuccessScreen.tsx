import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '../theme';

type RouteParams = {
    OrderSuccess: {
        order: {
            id: string;
            total: number;
            status: string;
        };
    };
};

export default function OrderSuccessScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RouteParams, 'OrderSuccess'>>();
    const { order } = route.params;

    const scaleAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="check-circle" size={100} color="#4CAF50" />
                </View>

                <Text style={styles.title}>Order Placed Successfully!</Text>
                <Text style={styles.subtitle}>Thank you for your order</Text>

                <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Order ID:</Text>
                        <Text style={styles.detailValue}>#{order.id.substring(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Amount:</Text>
                        <Text style={styles.detailValue}>{Number(order.total).toLocaleString('en-US')} XAF</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status:</Text>
                        <Text style={styles.statusBadge}>{order.status}</Text>
                    </View>
                </View>

                <Text style={styles.message}>
                    You will receive a confirmation email shortly. Expected delivery in 2-3 business days.
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('Orders')}
                >
                    <MaterialCommunityIcons name="package-variant" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>View My Orders</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Marketplace')}
                >
                    <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    content: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5
    },
    iconContainer: {
        marginBottom: 24
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center'
    },
    orderDetails: {
        width: '100%',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    detailLabel: {
        fontSize: 14,
        color: '#666'
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text
    },
    statusBadge: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        textTransform: 'capitalize'
    },
    message: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20
    },
    primaryButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 12,
        gap: 8
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    secondaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    secondaryButtonText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '600'
    }
});
