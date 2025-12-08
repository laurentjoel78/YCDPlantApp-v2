import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';

interface Seller {
  id: string;
  name: string;
  rating: number;
}

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  image: string;
  unit: string;
  seller: Seller;
  market_name?: string;
  stock_quantity?: number;
  onPress?: () => void;
  onAddToCart?: (productId: string) => void;
  style?: ViewStyle;
}

export const ProductCard = ({ id, name, price, image, unit, seller, market_name, stock_quantity, onPress, onAddToCart, style }: ProductCardProps) => {
  const isOutOfStock = stock_quantity !== undefined && stock_quantity <= 0;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
      <Image source={{ uri: image }} style={styles.image} />
      {isOutOfStock && (
        <View style={styles.outOfStockBadge}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.priceUnit}>
          <Text style={styles.price}>{price}</Text> / {unit}
        </Text>
        {market_name && (
          <View style={styles.marketRow}>
            <Icon name="map-marker" size={14} color={colors.primary} />
            <Text style={styles.marketText} numberOfLines={1}>{market_name}</Text>
          </View>
        )}
        {onAddToCart && !isOutOfStock && (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={(e) => {
              e.stopPropagation();
              onAddToCart(id);
            }}
          >
            <Icon name="cart-plus" size={18} color="#FFF" />
            <Text style={styles.cartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 8,
    marginHorizontal: 8,
    width: '45%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  priceUnit: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  marketText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  cartButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  outOfStockText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
});