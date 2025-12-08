import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';

export default function AddEditProductScreen({ route, navigation }: any) {
    const { token } = useAuth();
    const { productId } = route.params || {};
    const isEditing = !!productId;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        quantity: '',
        unit: 'kg',
        price_per_unit: '',
        currency: 'XAF',
        status: 'active',
    });

    useEffect(() => {
        if (isEditing) {
            loadProduct();
        }
    }, [productId]);

    const loadProduct = async () => {
        if (!token) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/products/${productId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();

            if (data.product) {
                setFormData({
                    title: data.product.title,
                    description: data.product.description,
                    quantity: String(data.product.quantity),
                    unit: data.product.unit,
                    price_per_unit: String(data.product.price_per_unit),
                    currency: data.product.currency,
                    status: data.product.status,
                });
            }
        } catch (error) {
            console.error('Failed to load product:', error);
            Alert.alert('Error', 'Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!token) return;

        // Validation
        if (!formData.title || !formData.quantity || !formData.price_per_unit) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);

            const url = isEditing
                ? `${process.env.EXPO_PUBLIC_API_URL}/api/products/${productId}`
                : `${process.env.EXPO_PUBLIC_API_URL}/api/products`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    quantity: parseFloat(formData.quantity),
                    price_per_unit: parseFloat(formData.price_per_unit),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save product');
            }

            Alert.alert(
                'Success',
                `Product ${isEditing ? 'updated' : 'created'} successfully`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Failed to save product:', error);
            Alert.alert('Error', 'Failed to save product');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    {isEditing ? 'Edit Product' : 'Add New Product'}
                </Text>
            </View>

            <View style={styles.form}>
                <TextInput
                    label="Product Title *"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label="Description"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    style={styles.input}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                />

                <View style={styles.row}>
                    <TextInput
                        label="Quantity *"
                        value={formData.quantity}
                        onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                        style={[styles.input, styles.halfInput]}
                        mode="outlined"
                        keyboardType="numeric"
                    />

                    <TextInput
                        label="Unit"
                        value={formData.unit}
                        onChangeText={(text) => setFormData({ ...formData, unit: text })}
                        style={[styles.input, styles.halfInput]}
                        mode="outlined"
                    />
                </View>

                <View style={styles.row}>
                    <TextInput
                        label="Price per Unit *"
                        value={formData.price_per_unit}
                        onChangeText={(text) => setFormData({ ...formData, price_per_unit: text })}
                        style={[styles.input, styles.halfInput]}
                        mode="outlined"
                        keyboardType="numeric"
                    />

                    <TextInput
                        label="Currency"
                        value={formData.currency}
                        onChangeText={(text) => setFormData({ ...formData, currency: text })}
                        style={[styles.input, styles.halfInput]}
                        mode="outlined"
                    />
                </View>

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={submitting}
                    disabled={submitting}
                    style={styles.submitButton}
                >
                    {isEditing ? 'Update Product' : 'Create Product'}
                </Button>

                <Button
                    mode="outlined"
                    onPress={() => navigation.goBack()}
                    disabled={submitting}
                    style={styles.cancelButton}
                >
                    Cancel
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    form: {
        padding: 16,
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    submitButton: {
        marginTop: 8,
        paddingVertical: 8,
    },
    cancelButton: {
        marginTop: 12,
        paddingVertical: 8,
    },
});
