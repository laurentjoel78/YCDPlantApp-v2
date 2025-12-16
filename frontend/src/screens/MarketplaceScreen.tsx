import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { SearchBar } from '../components/SearchBar';
import { ProductCard } from '../components/ProductCard';
import { categories } from '../data/marketplace';
import { useSocket } from '../context/SocketContext';
import { cacheService, CACHE_KEYS } from '../services/cacheService';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const MarketplaceScreen: React.FC = () => {
  const { colors } = useTheme();
  const { subscribe } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Use cached products to avoid loading spinner on return visits
  const cachedProducts = cacheService.get<any[]>(CACHE_KEYS.PRODUCTS);
  const [products, setProducts] = useState<any[]>(cachedProducts || []);
  const [loading, setLoading] = useState(!cachedProducts); // Only show loading if no cache
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const loadProducts = useCallback(async (forceLoading = false) => {
    try {
      if (forceLoading) setLoading(true);
      const res = await api.products.list();
      const productsList = res.products || [];
      setProducts(productsList);
      cacheService.set(CACHE_KEYS.PRODUCTS, productsList); // Update cache
    } catch (err) {
      console.warn('Failed to load products', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Listen for real-time product updates
  useEffect(() => {
    const events = ['PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE'];
    const unsubscribers = events.map(event =>
      subscribe(event, () => {
        cacheService.invalidate(CACHE_KEYS.PRODUCTS);
        loadProducts();
      })
    );
    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe, loadProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cacheService.invalidate(CACHE_KEYS.PRODUCTS);
    loadProducts();
  }, [loadProducts]);

  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const handleAddToCart = async (productId: string) => {
    try {
      // Check if user is logged in
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

      await api.cart.addItem(productId, 1);
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
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    searchContainer: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    categoriesContainer: {
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeCategoryChip: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeCategoryText: {
      color: colors.surface,
    },
    productsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 8,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  const filteredProducts = products.filter((product: any) => {
    const name = (product.name || '').toString();
    const desc = (product.description || '').toString();
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());
    const productCategory = (product.category || 'general').toLowerCase();
    const matchesCategory = selectedCategory === 'all' || productCategory === selectedCategory;
    return matchesCategory && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA';
  };

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('marketplace.title', 'Marketplace')}</Text>
      <Text style={styles.headerSubtitle}>{t('marketplace.subtitle', 'Find quality agricultural products')}</Text>
    </View>
  ), [styles, t]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('marketplace.searchPlaceholder', 'Search products...')}
        />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.activeCategoryChip,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.activeCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <View style={styles.productsContainer}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={formatCurrency(Number(product.price))}
                unit={product.unit}
                image={Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : (typeof product.images === 'string' ? product.images : 'https://via.placeholder.com/150')}
                market_name={product.market_name}
                stock_quantity={product.stock_quantity}
                seller={{
                  id: product.seller?.id || 'unknown',
                  name: product.seller ? `${product.seller.first_name} ${product.seller.last_name}` : 'Unknown Seller',
                  rating: 0
                }}
                onPress={() => Alert.alert(t('common.comingSoon'), t('marketplace.detailsComingSoon', 'Product details view will be available in the next update.'))}
                onAddToCart={handleAddToCart}
                style={{ width: '45%', marginBottom: 16 }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {t('marketplace.noProducts', 'No products found matching your search.')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MarketplaceScreen;