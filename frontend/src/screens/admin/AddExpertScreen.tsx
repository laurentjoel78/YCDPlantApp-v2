import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { TextInput, Button, Chip, Text, Switch } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AddExpertScreen = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bio: '',
        specializations: [] as string[],
        languages: [] as string[],
        certifications: [] as string[],
        experience: '',
        hourlyRate: '',
        location: {
            latitude: 0,
            longitude: 0,
            address: '',
            city: '',
            country: ''
        }
    });
    const [currentSpec, setCurrentSpec] = useState('');
    const [currentLang, setCurrentLang] = useState('');
    const [currentCert, setCurrentCert] = useState('');
    const [availability, setAvailability] = useState({
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '17:00' },
        sunday: { enabled: false, start: '09:00', end: '17:00' }
    });

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant camera roll permissions');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleAddSpec = () => {
        if (currentSpec.trim()) {
            setFormData(prev => ({
                ...prev,
                specializations: [...prev.specializations, currentSpec.trim()]
            }));
            setCurrentSpec('');
        }
    };

    const handleRemoveSpec = (index: number) => {
        setFormData(prev => ({
            ...prev,
            specializations: prev.specializations.filter((_, i) => i !== index)
        }));
    };

    const handleAddLang = () => {
        if (currentLang.trim()) {
            setFormData(prev => ({
                ...prev,
                languages: [...prev.languages, currentLang.trim()]
            }));
            setCurrentLang('');
        }
    };

    const handleRemoveLang = (index: number) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.filter((_, i) => i !== index)
        }));
    };

    const handleAddCert = () => {
        if (currentCert.trim()) {
            setFormData(prev => ({
                ...prev,
                certifications: [...prev.certifications, currentCert.trim()]
            }));
            setCurrentCert('');
        }
    };

    const handleRemoveCert = (index: number) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.hourlyRate) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);

            // Prepare the data
            const expertData: any = {
                ...formData,
                experience: parseInt(formData.experience) || 0,
                hourlyRate: parseFloat(formData.hourlyRate) || 0,
                location: {
                    latitude: 0,
                    longitude: 0,
                    address: 'Remote',
                    city: 'Remote',
                    country: 'Cameroon'
                },
                availability: {
                    available: true,
                    schedule: availability
                }
            };

            // If image is selected, use FormData
            if (imageUri) {
                if (!token) {
                    Alert.alert('Error', 'Authentication required');
                    return;
                }

                const formData = new FormData();
                formData.append('firstName', expertData.firstName);
                formData.append('lastName', expertData.lastName);
                formData.append('email', expertData.email);
                formData.append('phone', expertData.phone || '');
                formData.append('bio', expertData.bio || '');
                formData.append('experience', expertData.experience.toString());
                formData.append('hourlyRate', expertData.hourlyRate.toString());
                formData.append('specializations', JSON.stringify(expertData.specializations));
                formData.append('languages', JSON.stringify(expertData.languages));
                formData.append('certifications', JSON.stringify(expertData.certifications));
                formData.append('location', JSON.stringify(expertData.location));
                formData.append('availability', JSON.stringify(expertData.availability));

                // Add image file
                const filename = imageUri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('profileImage', {
                    uri: imageUri,
                    name: filename,
                    type
                } as any);

                await adminService.createExpertWithImage(token, formData);
            } else {
                if (!token) {
                    Alert.alert('Error', 'Authentication required');
                    return;
                }
                await adminService.createExpert(token, expertData);
            }


            Alert.alert('Success', 'Expert created successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error creating expert:', error);
            Alert.alert('Error', 'Failed to create expert');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text variant="titleLarge" style={styles.title}>New Expert Profile</Text>

                {/* Profile Image */}
                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Icon name="camera-plus" size={40} color="#999" />
                                <Text style={styles.imagePlaceholderText}>Add Profile Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <TextInput
                    label="First Name *"
                    value={formData.firstName}
                    onChangeText={text => setFormData({ ...formData, firstName: text })}
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label="Last Name *"
                    value={formData.lastName}
                    onChangeText={text => setFormData({ ...formData, lastName: text })}
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label="Email *"
                    value={formData.email}
                    onChangeText={text => setFormData({ ...formData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label="Phone"
                    value={formData.phone}
                    onChangeText={text => setFormData({ ...formData, phone: text })}
                    keyboardType="phone-pad"
                    style={styles.input}
                    mode="outlined"
                />

                {/* Bio */}
                <TextInput
                    label="Bio / About"
                    value={formData.bio}
                    onChangeText={text => setFormData({ ...formData, bio: text })}
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textArea]}
                    mode="outlined"
                />

                <View style={styles.row}>
                    <TextInput
                        label="Experience (Years)"
                        value={formData.experience}
                        onChangeText={text => setFormData({ ...formData, experience: text })}
                        keyboardType="numeric"
                        style={[styles.input, styles.halfInput]}
                        mode="outlined"
                    />
                    <TextInput
                        label="Hourly Rate (FCFA) *"
                        value={formData.hourlyRate}
                        onChangeText={text => setFormData({ ...formData, hourlyRate: text })}
                        keyboardType="numeric"
                        style={[styles.input, styles.halfInput]}
                        mode="outlined"
                    />
                </View>

                {/* Specializations */}
                <View style={styles.chipSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Specializations</Text>
                    <TextInput
                        label="Add Specialization"
                        value={currentSpec}
                        onChangeText={setCurrentSpec}
                        right={<TextInput.Icon icon="plus" onPress={handleAddSpec} />}
                        style={styles.input}
                        mode="outlined"
                        onSubmitEditing={handleAddSpec}
                    />
                    <View style={styles.chips}>
                        {formData.specializations.map((spec, index) => (
                            <Chip
                                key={index}
                                onClose={() => handleRemoveSpec(index)}
                                style={styles.chip}
                            >
                                {spec}
                            </Chip>
                        ))}
                    </View>
                </View>

                {/* Languages */}
                <View style={styles.chipSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Languages</Text>
                    <TextInput
                        label="Add Language"
                        value={currentLang}
                        onChangeText={setCurrentLang}
                        right={<TextInput.Icon icon="plus" onPress={handleAddLang} />}
                        style={styles.input}
                        mode="outlined"
                        onSubmitEditing={handleAddLang}
                    />
                    <View style={styles.chips}>
                        {formData.languages.map((lang, index) => (
                            <Chip
                                key={index}
                                onClose={() => handleRemoveLang(index)}
                                style={styles.chip}
                            >
                                {lang}
                            </Chip>
                        ))}
                    </View>
                </View>

                {/* Certifications  */}
                <View style={styles.chipSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Certifications</Text>
                    <TextInput
                        label="Add Certification"
                        value={currentCert}
                        onChangeText={setCurrentCert}
                        right={<TextInput.Icon icon="plus" onPress={handleAddCert} />}
                        style={styles.input}
                        mode="outlined"
                        onSubmitEditing={handleAddCert}
                    />
                    <View style={styles.chips}>
                        {formData.certifications.map((cert, index) => (
                            <Chip
                                key={index}
                                onClose={() => handleRemoveCert(index)}
                                style={styles.chip}
                            >
                                {cert}
                            </Chip>
                        ))}
                    </View>
                </View>

                {/* Availability */}
                <View style={styles.availabilitySection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Availability</Text>
                    {Object.keys(availability).map((day) => (
                        <View key={day} style={styles.dayRow}>
                            <Switch
                                value={availability[day as keyof typeof availability].enabled}
                                onValueChange={(value) => setAvailability(prev => ({
                                    ...prev,
                                    [day]: { ...prev[day as keyof typeof prev], enabled: value }
                                }))}
                            />
                            <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                        </View>
                    ))}
                </View>

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                >
                    Create Expert Account
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
    imageSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    imagePicker: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    imagePlaceholderText: {
        marginTop: 8,
        fontSize: 12,
        color: '#999',
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    chipSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        marginBottom: 8,
        color: '#2E7D32',
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    chip: {
        marginRight: 8,
        marginBottom: 8,
    },
    availabilitySection: {
        marginBottom: 20,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dayLabel: {
        marginLeft: 12,
        fontSize: 16,
    },
    button: {
        marginTop: 20,
        marginBottom: 40,
        backgroundColor: '#2E7D32',
    },
    buttonContent: {
        paddingVertical: 8,
    },
});

export default AddExpertScreen;
