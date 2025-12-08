import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, HelperText, ActivityIndicator, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { productService } from '../../services/productService';
import { useAuth } from '../../hooks/useAuth';

const AddProductScreen = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        quantity: '',
        unit: 'kg',
        status: 'active',
        market_name: ''
    });

    const categories = ['Vegetables', 'Fruits', 'Grains', 'Livestock', 'Dairy', 'Other'];
    const units = ['kg', 'g', 'piece', 'bundle', 'liter', 'ton'];

    const pickImage = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.category || !formData.price || !formData.quantity) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!token) {
            Alert.alert('Error', 'Authentication required');
            return;
        }

        try {
            setLoading(true);

            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('price', formData.price);
            data.append('quantity', formData.quantity);
            data.append('unit', formData.unit);
            data.append('status', formData.status);
            if (formData.market_name) {
                data.append('market_name', formData.market_name);
            }

            // Append images
            images.forEach((uri, index) => {
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                // @ts-ignore
                data.append('images', { uri, name: filename, type });
            });

            await productService.createProduct(token, data);

            Alert.alert('Success', 'Product created successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error creating product:', error);
            Alert.alert('Error', 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text variant="titleLarge" style={styles.header}>Add New Product</Text>

                <TextInput
                    label="Product Name *"
                    value={formData.name}
                    onChangeText={text => setFormData({ ...formData, name: text })}
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label="Description"
                    value={formData.description}
                    onChangeText={text => setFormData({ ...formData, description: text })}
                    style={styles.input}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                />

                <TextInput
                    label="Market Name (where product is sold)"
                    value={formData.market_name}
                    onChangeText={text => setFormData({ ...formData, market_name: text })}
                    style={styles.input}
                    mode="outlined"
                    placeholder="e.g., Marché Central Yaoundé"
                />

                <Text variant="bodyMedium" style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {categories.map(cat => (
                        <Chip
                            key={cat}
                            selected={formData.category === cat}
                            onPress={() => setFormData({ ...formData, category: cat })}
                            style={styles.chip}
                            showSelectedOverlay
                        >
                            {cat}
                        </Chip>
                    ))}
                </ScrollView>

                <View style={styles.row}>
                    <TextInput
                        label="Price *"
                        value={formData.price}
                        onChangeText={text => setFormData({ ...formData, price: text })}
                        style={[styles.input, styles.halfInput]}
                        mode="outlined"
                        keyboardType="numeric"
                        left={<TextInput.Affix text="XAF " />}
                    />

                    <TextInput
                        label="Quantity *"
                        value={formData.quantity}
                        onChangeText={text => setFormData({ ...formData, quantity: text })}
                        style={[styles.input, styles.halfInput]}
                        mode="outlined"
                        keyboardType="numeric"
                    />
                </View>

                <Text variant="bodyMedium" style={styles.label}>Unit *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {units.map(u => (
                        <Chip
                            key={u}
                            selected={formData.unit === u}
                            onPress={() => setFormData({ ...formData, unit: u })}
                            style={styles.chip}
                            showSelectedOverlay
                        >
                            {u}
                        </Chip>
                    ))}
                </ScrollView>

                <Text variant="bodyMedium" style={styles.label}>Images</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                        <Text style={styles.addImageText}>+</Text>
                    </TouchableOpacity>

                    {images.map((uri, index) => (
                        <View key={index} style={styles.imageContainer}>
                            <Image source={{ uri }} style={styles.image} />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeImage(index)}
                            >
                                <Text style={styles.removeButtonText}>×</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.submitButton}
                    buttonColor="#2E7D32"
                >
                    Create Product
                </Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    form: {
        padding: 16,
    },
    header: {
        marginBottom: 20,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    label: {
        marginTop: 8,
        marginBottom: 8,
        fontWeight: '500',
    },
    chipScroll: {
        marginBottom: 16,
        flexDirection: 'row',
    },
    chip: {
        marginRight: 8,
    },
    imageScroll: {
        marginBottom: 24,
        flexDirection: 'row',
    },
    addImageButton: {
        width: 80,
        height: 80,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    addImageText: {
        fontSize: 32,
        color: '#888',
    },
    imageContainer: {
        position: 'relative',
        marginRight: 12,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'red',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    submitButton: {
        marginTop: 16,
        paddingVertical: 6,
    },
});

export default AddProductScreen;
