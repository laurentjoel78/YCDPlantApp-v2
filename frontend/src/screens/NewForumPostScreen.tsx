import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';

interface NewForumPostScreenProps {
    route: {
        params: {
            categoryId: string;
            region: string;
        };
    };
    navigation: any;
}

export default function NewForumPostScreen({ route, navigation }: NewForumPostScreenProps) {
    const { categoryId, region } = route.params;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const addTag = () => {
        if (tagInput.trim() && tags.length < 5) {
            setTags([...tags, (tagInput || '').trim().toLowerCase()]);
            setTagInput('');
        }
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const pickImage = async () => {
        if (images.length >= 5) {
            // Show error message - max 5 images
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        // Validate input
        if (!title.trim() || !content.trim()) {
            // Show error message
            return;
        }

        // TODO: Submit post to backend
        console.log({
            title,
            content,
            categoryId,
            region,
            tags,
            images,
        });

        // Navigate back to forum
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.form}>
                <TextInput
                    style={styles.titleInput}
                    placeholder="Titre de votre publication"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />

                <TextInput
                    style={styles.contentInput}
                    placeholder="Contenu de votre publication..."
                    value={content}
                    onChangeText={setContent}
                    multiline
                    numberOfLines={10}
                    textAlignVertical="top"
                />

                <View style={styles.tagsSection}>
                    <Text style={styles.sectionTitle}>Tags (max 5)</Text>
                    <View style={styles.tagInput}>
                        <TextInput
                            style={styles.tagInputField}
                            placeholder="Ajouter un tag"
                            value={tagInput}
                            onChangeText={setTagInput}
                            onSubmitEditing={addTag}
                            returnKeyType="done"
                            maxLength={20}
                        />
                        <TouchableOpacity
                            style={styles.addTagButton}
                            onPress={addTag}
                            disabled={!tagInput.trim() || tags.length >= 5}
                        >
                            <Icon name="plus" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.tags}>
                        {tags.map((tag, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.tag}
                                onPress={() => removeTag(index)}
                            >
                                <Text style={styles.tagText}>{tag}</Text>
                                <Icon name="close" size={16} color="#6B7280" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.imagesSection}>
                    <Text style={styles.sectionTitle}>Images (max 5)</Text>
                    <TouchableOpacity
                        style={styles.addImageButton}
                        onPress={pickImage}
                        disabled={images.length >= 5}
                    >
                        <Icon name="image-plus" size={24} color="#6B7280" />
                        <Text style={styles.addImageText}>Ajouter une image</Text>
                    </TouchableOpacity>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.imagesScroll}
                    >
                        {images.map((uri, index) => (
                            <View key={index} style={styles.imageContainer}>
                                <Image source={{ uri }} style={styles.image} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <Icon name="close" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                >
                    <Text style={styles.submitButtonText}>Publier</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    form: {
        flex: 1,
        padding: 16,
    },
    titleInput: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 16,
    },
    contentInput: {
        fontSize: 16,
        color: '#4B5563',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        minHeight: 200,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    tagsSection: {
        marginBottom: 24,
    },
    tagInput: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    tagInputField: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
    },
    addTagButton: {
        backgroundColor: '#2D5016',
        borderRadius: 8,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 4,
    },
    tagText: {
        fontSize: 14,
        color: '#4B5563',
    },
    imagesSection: {
        marginBottom: 24,
    },
    addImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#E5E7EB',
        paddingVertical: 16,
        gap: 8,
        marginBottom: 12,
    },
    addImageText: {
        fontSize: 16,
        color: '#6B7280',
    },
    imagesScroll: {
        flexGrow: 0,
    },
    imageContainer: {
        position: 'relative',
        marginRight: 8,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    submitButton: {
        backgroundColor: '#2D5016',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});