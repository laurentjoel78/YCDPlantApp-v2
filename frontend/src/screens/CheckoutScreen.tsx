import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

type RouteParams = {
    Checkout: {
        totals: {
            subtotal: number;
            deliveryFee: number;
            total: number;
        };
    };
};

export default function CheckoutScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RouteParams, 'Checkout'>>();
    const { totals } = route.params;

    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('South-West');
    const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'orange' | 'cash_on_delivery'>('mtn');
    const [phoneNumber, setPhoneNumber] = useState('');

    const regions = ['Adamawa', 'Center', 'East', 'Far-North', 'Littoral', 'North', 'North-West', 'South', 'South-West', 'West'];

    const handleCheckout = async () => {
        // Validation
        if (!address.trim()) {
            Alert.alert('Error', 'Please enter delivery address');
            return;
        }
        if (!city.trim()) {
            Alert.alert('Error', 'Please enter city');
            return;
        }
        if (paymentMethod !== 'cash_on_delivery' && !phoneNumber.trim()) {
            Alert.alert('Error', 'Please enter phone number for Mobile Money');
            return;
        }

        try {
            setLoading(true);

            const response = await api.checkout.createOrder({
                deliveryAddress: { address, city, region },
                paymentMethod,
                phoneNumber
            });

            if (response.success) {
                // Show payment modal or success
                if (paymentMethod === 'cash_on_delivery') {
                    navigation.replace('OrderSuccess', { order: response.data.order });
                } else {
                    navigation.navigate('PaymentModal', {
                        payment: response.data.payment,
                        order: response.data.order
                    });
                }
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Street address"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={2}
                />

                <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={city}
                    onChangeText={setCity}
                />

                <Text style={styles.label}>Region</Text>
                <View style={styles.regionButtons}>
                    {regions.map((r) => (
                        <TouchableOpacity
                            key={r}
                            style={[styles.regionButton, region === r && styles.regionButtonActive]}
                            onPress={() => setRegion(r)}
                        >
                            <Text style={[styles.regionButtonText, region === r && styles.regionButtonTextActive]}>
                                {r}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Method</Text>

                <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'mtn' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod('mtn')}
                >
                    <View style={styles.paymentOptionContent}>
                        <MaterialCommunityIcons
                            name="cellphone"
                            size={24}
                            color={paymentMethod === 'mtn' ? theme.colors.primary : '#666'}
                        />
                        <View style={styles.paymentOptionText}>
                            <Text style={[styles.paymentOptionTitle, paymentMethod === 'mtn' && styles.activeText]}>
                                MTN Mobile Money
                            </Text>
                            <Text style={styles.paymentOptionSubtitle}>Pay with *126#</Text>
                        </View>
                    </View>
                    {paymentMethod === 'mtn' && (
                        <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'orange' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod('orange')}
                >
                    <View style={styles.paymentOptionContent}>
                        <MaterialCommunityIcons
                            name="cellphone"
                            size={24}
                            color={paymentMethod === 'orange' ? theme.colors.primary : '#666'}
                        />
                        <View style={styles.paymentOptionText}>
                            <Text style={[styles.paymentOptionTitle, paymentMethod === 'orange' && styles.activeText]}>
                                Orange Money
                            </Text>
                            <Text style={styles.paymentOptionSubtitle}>Pay with #150#</Text>
                        </View>
                    </View>
                    {paymentMethod === 'orange' && (
                        <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'cash_on_delivery' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod('cash_on_delivery')}
                >
                    <View style={styles.paymentOptionContent}>
                        <MaterialCommunityIcons
                            name="cash"
                            size={24}
                            color={paymentMethod === 'cash_on_delivery' ? theme.colors.primary : '#666'}
                        />
                        <View style={styles.paymentOptionText}>
                            <Text style={[styles.paymentOptionTitle, paymentMethod === 'cash_on_delivery' && styles.activeText]}>
                                Cash on Delivery
                            </Text>
                            <Text style={styles.paymentOptionSubtitle}>Pay when you receive</Text>
                        </View>
                    </View>
                    {paymentMethod === 'cash_on_delivery' && (
                        <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
                    )}
                </TouchableOpacity>

                {paymentMethod !== 'cash_on_delivery' && (
                    <TextInput
                        style={styles.input}
                        placeholder="Phone number (e.g., +237 6XX XXX XXX)"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                    />
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal:</Text>
                    <Text style={styles.summaryValue}>{Number(totals.subtotal).toLocaleString('en-US')} XAF</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery:</Text>
                    <Text style={styles.summaryValue}>{Number(totals.deliveryFee).toLocaleString('en-US')} XAF</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>{Number(totals.total).toLocaleString('en-US')} XAF</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
                onPress={handleCheckout}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Text style={styles.checkoutButtonText}>Complete Order</Text>
                        <MaterialCommunityIcons name="check" size={24} color="#FFF" />
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5'
    },
    section: {
        backgroundColor: '#FFF',
        padding: 16,
        marginBottom: 12
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
        backgroundColor: '#FFF'
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8
    },
    regionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    regionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#FFF'
    },
    regionButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary
    },
    regionButtonText: {
        fontSize: 14,
        color: '#666'
    },
    regionButtonTextActive: {
        color: '#FFF',
        fontWeight: '600'
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#FFF'
    },
    paymentOptionActive: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
        backgroundColor: '#F0F8FF'
    },
    paymentOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    paymentOptionText: {
        marginLeft: 12,
        flex: 1
    },
    paymentOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text
    },
    activeText: {
        color: theme.colors.primary
    },
    paymentOptionSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 2
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666'
    },
    summaryValue: {
        fontSize: 14,
        color: theme.colors.text
    },
    totalRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0'
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary
    },
    checkoutButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        borderRadius: 12,
        gap: 8
    },
    checkoutButtonDisabled: {
        opacity: 0.6
    },
    checkoutButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
