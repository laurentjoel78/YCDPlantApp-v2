import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Image } from 'react-native';
import { Text, Card, FAB, Searchbar, Chip, IconButton, Menu, Divider, ActivityIndicator, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { productService } from '../../services/productService';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import { cacheService, CACHE_KEYS } from '../../services/cacheService';
import { getImageUrl } from '../../utils/imageUtils';

const ProductManagementScreen = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const { subscribe } = useSocket();
    // Use cached admin products to avoid loading spinner on return visits
    const cachedProducts = cacheService.get<any[]>(CACHE_KEYS.ADMIN_PRODUCTS);
    const [loading, setLoading] = useState(!cachedProducts);
    const [products, setProducts] = useState<any[]>(cachedProducts || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuVisible, setMenuVisible] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        if (!token) return;
        try {
            if (products.length === 0) setLoading(true);
            const data = await productService.getAllProducts(token);
            const productsList = data.products || [];
            setProducts(productsList);
            cacheService.set(CACHE_KEYS.ADMIN_PRODUCTS, productsList);
        } catch (error) {
            console.error('Error fetching products:', error);
            Alert.alert('Error', 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [token, products.length]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Listen for real-time product updates
    useEffect(() => {
        const events = ['PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE'];
        const unsubscribers = events.map(event =>
            subscribe(event, () => {
                cacheService.invalidate(CACHE_KEYS.ADMIN_PRODUCTS);
                fetchProducts();
            })
        );
        return () => unsubscribers.forEach(unsub => unsub());
    }, [subscribe, fetchProducts]);

    const handleDeleteProduct = (productId: string) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await productService.deleteProduct(token!, productId);
                            Alert.alert('Success', 'Product deleted successfully');
                            fetchProducts();
                        } catch (error) {
                            console.error('Error deleting product:', error);
                            Alert.alert('Error', 'Failed to delete product');
                        }
                    }
                }
            ]
        );
    };

    const renderProductCard = ({ item }: { item: any }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <View style={styles.imageContainer}>
                        {item.images && item.images.length > 0 ? (
                            <Image source={getImageUrl(item.images[0])} style={styles.productImage} />
                        ) : (
                            <View style={[styles.productImage, styles.placeholderImage]}>
                                <Text variant="labelSmall">No Image</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.infoContainer}>
                        <View style={styles.titleRow}>
                            <Text variant="titleMedium" style={styles.title} numberOfLines={1}>{item.name}</Text>
                            <Menu
                                visible={menuVisible === item.id}
                                onDismiss={() => setMenuVisible(null)}
                                anchor={
                                    <IconButton
                                        icon="dots-vertical"
                                        size={20}
                                        onPress={() => setMenuVisible(item.id)}
                                    />
                                }
                            >
                                <Menu.Item onPress={() => { }} title="Edit" leadingIcon="pencil" />
                                <Divider />
                                <Menu.Item
                                    onPress={() => {
                                        setMenuVisible(null);
                                        handleDeleteProduct(item.id);
                                    }}
                                    title="Delete"
                                    leadingIcon="delete"
                                    titleStyle={{ color: 'red' }}
                                />
                            </Menu>
                        </View>

                        <Text variant="bodySmall" numberOfLines={2} style={styles.description}>
                            {item.description}
                        </Text>

                        <View style={styles.detailsRow}>
                            <Text variant="titleSmall" style={styles.price}>
                                {item.currency} {item.price} / {item.unit}
                            </Text>
                            <Chip
                                style={[styles.statusChip, item.status === 'active' ? styles.activeChip : styles.inactiveChip]}
                                textStyle={styles.statusText}
                                compact
                            >
                                {item.status}
                            </Chip>
                        </View>

                        <View style={styles.metaRow}>
                            <Text variant="bodySmall" style={styles.metaText}>Stock: {item.quantity}</Text>
                            <Text variant="bodySmall" style={styles.metaText}>•</Text>
                            <Text variant="bodySmall" style={styles.metaText}>{item.category}</Text>
                        </View>
                    </View>
                </View>
            </Card.Content>
        </Card>
    );

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Loading products...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Search products..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={['All', 'Vegetables', 'Fruits', 'Grains', 'Livestock', 'Dairy']}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <Chip
                            selected={categoryFilter === (item === 'All' ? null : item)}
                            onPress={() => setCategoryFilter(item === 'All' ? null : item)}
                            style={styles.filterChip}
                            showSelectedOverlay
                        >
                            {item}
                        </Chip>
                    )}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            <FlatList
                data={filteredProducts}
                renderItem={renderProductCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text>No products found</Text>
                    </View>
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                // @ts-ignore
                onPress={() => navigation.navigate('AddProduct')}
                label="Add Product"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
    },
    searchBar: {
        margin: 16,
        marginBottom: 8,
        elevation: 2,
        backgroundColor: 'white',
    },
    filterContainer: {
        marginBottom: 8,
    },
    filterList: {
        paddingHorizontal: 16,
    },
    filterChip: {
        marginRight: 8,
    },
    list: {
        padding: 16,
        paddingTop: 8,
    },
    card: {
        marginBottom: 12,
        elevation: 2,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontWeight: 'bold',
        flex: 1,
        marginRight: 4,
    },
    description: {
        color: '#666',
        marginBottom: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    price: {
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    statusChip: {
        height: 24,
    },
    activeChip: {
        backgroundColor: '#e8f5e9',
    },
    inactiveChip: {
        backgroundColor: '#ffebee',
    },
    statusText: {
        fontSize: 10,
        lineHeight: 10,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        color: '#888',
        marginRight: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#2E7D32',
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
});

export default ProductManagementScreen;
