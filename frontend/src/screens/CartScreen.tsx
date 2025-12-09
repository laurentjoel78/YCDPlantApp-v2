import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

interface CartItem {
    id: string;
    product: {
        id: string;
        name: string;
        price: number;
        images?: string[];
    };
    quantity: number;
    price_at_add: number;
}

export default function CartScreen() {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totals, setTotals] = useState({
        subtotal: 0,
        deliveryFee: 0,
        total: 0
    });

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            setLoading(true);
            const response = await api.cart.get();
            setCartItems(response.data.cart.items || []);
            setTotals({
                subtotal: response.data.subtotal || 0,
                deliveryFee: response.data.deliveryFee || 0,
                total: response.data.total || 0
            });
        } catch (error) {
            console.error('Load cart error:', error);
            Alert.alert('Error', 'Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            await api.cart.updateItem(itemId, newQuantity);
            await loadCart(); // Reload to get updated totals
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to update quantity');
        }
    };

    const removeItem = async (itemId: string) => {
        Alert.alert(
            'Remove Item',
            'Are you sure you want to remove this item from cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.cart.removeItem(itemId);
                            await loadCart();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove item');
                        }
                    }
                }
            ]
        );
    };

    const proceedToCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty');
            return;
        }
        navigation.navigate('Checkout', { totals });
    };

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            <Image
                source={{ uri: item.product.images?.[0] || 'https://via.placeholder.com/80' }}
                style={styles.productImage}
            />
            <View style={styles.itemDetails}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.productPrice}>
                    {Number(item.price_at_add).toLocaleString('en-US')} XAF
                </Text>

                <View style={styles.quantityControl}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                        <MaterialCommunityIcons name="minus" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>{item.quantity}</Text>

                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.itemActions}>
                <Text style={styles.itemTotal}>
                    {(Number(item.price_at_add) * item.quantity).toLocaleString('en-US')} XAF
                </Text>
                <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={styles.removeButton}
                >
                    <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {cartItems.length === 0 ? (
                <View style={styles.emptyCart}>
                    <MaterialCommunityIcons name="cart-outline" size={80} color="#CCC" />
                    <Text style={styles.emptyText}>Your cart is empty</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Main', { screen: 'Marketplace' })}
                    >
                        <Text style={styles.shopButtonText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item.id}
                        renderItem={renderCartItem}
                        contentContainerStyle={styles.list}
                    />

                    <View style={styles.footer}>
                        <View style={styles.totalsContainer}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal:</Text>
                                <Text style={styles.totalValue}>{Number(totals.subtotal).toLocaleString('en-US')} XAF</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Delivery:</Text>
                                <Text style={styles.totalValue}>{Number(totals.deliveryFee).toLocaleString('en-US')} XAF</Text>
                            </View>
                            <View style={[styles.totalRow, styles.grandTotal]}>
                                <Text style={styles.grandTotalLabel}>Total:</Text>
                                <Text style={styles.grandTotalValue}>{Number(totals.total).toLocaleString('en-US')} XAF</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.checkoutButton}
                            onPress={proceedToCheckout}
                        >
                            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                            <MaterialCommunityIcons name="arrow-right" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5'
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    list: {
        padding: 16
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F0F0F0'
    },
    itemDetails: {
        flex: 1,
        marginLeft: 12
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4
    },
    productPrice: {
        fontSize: 14,
        color: theme.colors.primary,
        marginBottom: 8
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    quantityText: {
        marginHorizontal: 16,
        fontSize: 16,
        fontWeight: '600'
    },
    itemActions: {
        alignItems: 'flex-end',
        justifyContent: 'space-between'
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    removeButton: {
        marginTop: 8
    },
    emptyCart: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 18,
        color: '#999',
        marginTop: 16,
        marginBottom: 24
    },
    shopButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8
    },
    shopButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600'
    },
    footer: {
        backgroundColor: '#FFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0'
    },
    totalsContainer: {
        marginBottom: 16
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    totalLabel: {
        fontSize: 14,
        color: '#666'
    },
    totalValue: {
        fontSize: 14,
        color: theme.colors.text
    },
    grandTotal: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0'
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    grandTotalValue: {
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
        borderRadius: 12,
        gap: 8
    },
    checkoutButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
