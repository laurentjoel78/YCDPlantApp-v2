import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Switch, Text, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';

const CreateForumScreen = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'general',
        isLocationBased: false,
        region: ''
    });

    const handleSubmit = async () => {
        if (!formData.title || !formData.description || !formData.category) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (formData.isLocationBased && !formData.region) {
            Alert.alert('Error', 'Please select a region for location-based forum');
            return;
        }

        if (!token) {
            Alert.alert('Error', 'Authentication required');
            return;
        }

        try {
            setLoading(true);
            const topicData = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                region: formData.isLocationBased ? formData.region : null
            };

            await adminService.createForumTopic(token, topicData);

            Alert.alert('Success', 'Forum topic created successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error creating forum:', error);
            Alert.alert('Error', 'Failed to create forum topic');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text variant="titleLarge" style={styles.title}>Create New Forum</Text>

                <TextInput
                    label="Topic Title *"
                    value={formData.title}
                    onChangeText={text => setFormData({ ...formData, title: text })}
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label="Description *"
                    value={formData.description}
                    onChangeText={text => setFormData({ ...formData, description: text })}
                    multiline
                    numberOfLines={4}
                    style={styles.input}
                    mode="outlined"
                />

                <Text variant="bodyMedium" style={styles.label}>Category</Text>
                <SegmentedButtons
                    value={formData.category}
                    onValueChange={value => setFormData({ ...formData, category: value })}
                    buttons={[
                        { value: 'general', label: 'General' },
                        { value: 'farming', label: 'Farming' },
                        { value: 'market', label: 'Market' },
                    ]}
                    style={styles.segmentedButton}
                />

                <View style={styles.switchContainer}>
                    <Text variant="bodyLarge">Location Based Forum</Text>
                    <Switch
                        value={formData.isLocationBased}
                        onValueChange={val => setFormData({ ...formData, isLocationBased: val })}
                        color="#2E7D32"
                    />
                </View>

                {formData.isLocationBased && (
                    <View style={styles.locationContainer}>
                        <Text variant="bodyMedium" style={styles.label}>Select Region *</Text>
                        <SegmentedButtons
                            value={formData.region}
                            onValueChange={value => setFormData({ ...formData, region: value })}
                            buttons={[
                                { value: 'Centre', label: 'Centre' },
                                { value: 'Littoral', label: 'Littoral' },
                                { value: 'West', label: 'West' },
                                { value: 'Northwest', label: 'Northwest' },
                                { value: 'Southwest', label: 'Southwest' },
                            ]}
                            style={styles.segmentedButton}
                        />
                        <SegmentedButtons
                            value={formData.region}
                            onValueChange={value => setFormData({ ...formData, region: value })}
                            buttons={[
                                { value: 'South', label: 'South' },
                                { value: 'East', label: 'East' },
                                { value: 'Adamawa', label: 'Adamawa' },
                                { value: 'North', label: 'North' },
                                { value: 'Far North', label: 'Far North' },
                            ]}
                            style={[styles.segmentedButton, { marginTop: 8 }]}
                        />
                        <Text variant="bodySmall" style={styles.hint}>
                            Farmers in this region will be able to join and participate in this forum.
                        </Text>
                    </View>
                )}

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                >
                    Create Forum Topic
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
        padding: 20,
    },
    title: {
        marginBottom: 20,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    label: {
        marginBottom: 8,
        color: '#666',
    },
    segmentedButton: {
        marginBottom: 20,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 8,
    },
    locationContainer: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    hint: {
        color: '#666',
        fontStyle: 'italic',
    },
    button: {
        marginTop: 8,
        backgroundColor: '#2E7D32',
    },
    buttonContent: {
        paddingVertical: 8,
    },
});

export default CreateForumScreen;
