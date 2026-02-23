import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ProductDetailsScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { width } = useWindowDimensions();

    const [addingToCart, setAddingToCart] = useState(false);

    const product = route.params?.product;

    if (!product) {
        return (
            <SafeAreaView style={[{ flex: 1 }, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.textSecondary }}>Product not found.</Text>
            </SafeAreaView>
        );
    }

    const imageUrl = Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : (typeof product.images === 'string' && product.images ? product.images : 'https://via.placeholder.com/400');

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('fr-FR') + ' FCFA';
    };

    const handleAddToCart = async () => {
        try {
            if (!user) {
                Alert.alert(
                    'Login Required',
                    'Please log in to add items to your cart',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Login', onPress: () => navigation.navigate('Auth') }
                    ]
                );
                return;
            }

            setAddingToCart(true);
            await api.cart.addItem(product.id, 1);
            Alert.alert(
                'Added to Cart',
                'Product added successfully!',
                [
                    { text: 'Continue Shopping', style: 'cancel' },
                    { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
                ]
            );
        } catch (error: any) {
            console.error('Add to cart error:', error);
            const errorMessage = error.message || error.response?.data?.error || 'Failed to add to cart';

            if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
                Alert.alert(
                    'Session Expired',
                    'Please log in again to continue shopping',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Login', onPress: () => navigation.navigate('Auth') }
                    ]
                );
            } else {
                Alert.alert('Error', errorMessage);
            }
        } finally {
            setAddingToCart(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        imageContainer: {
            width: '100%',
            height: 300,
            backgroundColor: '#f5f5f5',
        },
        image: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        contentContainer: {
            padding: 20,
            paddingBottom: 100,
        },
        categoryBadge: {
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: colors.primary + '20',
            borderRadius: 16,
            marginBottom: 12,
        },
        categoryText: {
            color: colors.primary,
            fontSize: 12,
            fontWeight: '600',
            textTransform: 'capitalize',
        },
        titleRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            flex: 1,
            marginRight: 16,
        },
        price: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.primary,
        },
        unitText: {
            fontSize: 14,
            color: colors.textSecondary,
            fontWeight: 'normal',
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16,
        },
        metaText: {
            marginLeft: 4,
            fontSize: 14,
            color: colors.textSecondary,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 12,
            marginTop: 8,
        },
        description: {
            fontSize: 15,
            lineHeight: 24,
            color: colors.textSecondary,
            marginBottom: 24,
        },
        sellerCard: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
        },
        sellerIconContainer: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary + '20',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
        },
        sellerInfo: {
            flex: 1,
        },
        sellerName: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
        },
        sellerSubtitle: {
            fontSize: 13,
            color: colors.textSecondary,
        },
        footerAction: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        addToCartBtn: {
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: product.stock_quantity <= 0 ? 0.5 : 1,
        },
        addToCartText: {
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 'bold',
            marginLeft: 8,
        },
        outOfStockBadge: {
            backgroundColor: '#fee2e2',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            alignSelf: 'flex-start',
            marginTop: -8,
            marginBottom: 16,
        },
        outOfStockText: {
            color: '#dc2626',
            fontSize: 12,
            fontWeight: 'bold',
        }
    });

    const sellerName = product.seller ? `${product.seller.first_name || ''} ${product.seller.last_name || ''}`.trim() : 'Unknown Seller';
    const outOfStock = product.stock_quantity <= 0;

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                </View>

                <View style={styles.contentContainer}>
                    {product.category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{product.category}</Text>
                        </View>
                    )}

                    {outOfStock && (
                        <View style={styles.outOfStockBadge}>
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                    )}

                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{product.name}</Text>
                        <Text style={styles.price}>
                            {formatCurrency(Number(product.price))}
                            {product.unit ? <Text style={styles.unitText}>/{product.unit}</Text> : null}
                        </Text>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="package-variant" size={16} color={colors.textSecondary} />
                            <Text style={styles.metaText}>{product.stock_quantity} in stock</Text>
                        </View>
                        {product.market_name && (
                            <View style={styles.metaItem}>
                                <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
                                <Text style={styles.metaText}>{product.market_name}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>
                        {product.description || 'No description available for this product.'}
                    </Text>

                    <Text style={styles.sectionTitle}>Seller Information</Text>
                    <View style={styles.sellerCard}>
                        <View style={styles.sellerIconContainer}>
                            <MaterialCommunityIcons name="storefront-outline" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.sellerInfo}>
                            <Text style={styles.sellerName}>{sellerName}</Text>
                            <Text style={styles.sellerSubtitle}>Verified Seller</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.border} />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footerAction}>
                <TouchableOpacity
                    style={styles.addToCartBtn}
                    onPress={handleAddToCart}
                    disabled={outOfStock || addingToCart}
                >
                    <MaterialCommunityIcons name="cart-plus" size={24} color="#ffffff" />
                    <Text style={styles.addToCartText}>
                        {addingToCart ? 'Adding...' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default ProductDetailsScreen;
