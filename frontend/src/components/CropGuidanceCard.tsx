import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Chip, Divider, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CropData {
    npk?: { n?: number; p?: number; k?: number };
    timing?: string;
    method?: string;
    soil_notes?: string;
    pests?: string;
    control_methods?: string;
    diseases?: string;
    treatments?: string;
    soil_type?: string;
    notes?: string;
}

interface CropAdvisory {
    id: string;
    type: string;
    crop?: string;
    title: string;
    detail: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    recommended_inputs?: Array<{
        name: string;
        amount?: string;
        timing?: string;
        method?: string;
    }>;
    crop_data?: CropData;
}

interface CropGuidanceCardProps {
    crop: string;
    advisories: CropAdvisory[];
    onActionComplete?: (advisoryId: string) => void;
}

const CropGuidanceCard: React.FC<CropGuidanceCardProps> = ({ crop, advisories, onActionComplete }) => {
    const { t } = useTranslation();
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return '#DC2626';
            case 'high': return '#F59E0B';
            case 'medium': return '#3B82F6';
            case 'low': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'fertilizer': return 'sprout';
            case 'pest_control': return 'bug';
            case 'disease_management': return 'shield-alert';
            case 'watering': return 'water';
            case 'climate': return 'weather-partly-cloudy';
            case 'soil_management': return 'shovel';
            default: return 'information';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'fertilizer': return 'Fertilizer';
            case 'pest_control': return 'Pest Control';
            case 'disease_management': return 'Disease Prevention';
            case 'watering': return 'Irrigation';
            case 'climate': return 'Weather';
            case 'soil_management': return 'Soil';
            default: return 'Advisory';
        }
    };

    // Group advisories by type
    const fertilizerAdvisories = advisories.filter(a => a.type === 'fertilizer');
    const pestAdvisories = advisories.filter(a => a.type === 'pest_control');
    const diseaseAdvisories = advisories.filter(a => a.type === 'disease_management');
    const waterAdvisories = advisories.filter(a => a.type === 'watering' || a.type === 'climate');
    const soilAdvisories = advisories.filter(a => a.type === 'soil_management');
    const otherAdvisories = advisories.filter(a =>
        !['fertilizer', 'pest_control', 'disease_management', 'watering', 'climate', 'soil_management'].includes(a.type)
    );

    const renderAdvisorySection = (title: string, icon: string, sectionAdvisories: CropAdvisory[], sectionKey: string) => {
        if (sectionAdvisories.length === 0) return null;

        const isExpanded = expandedSections[sectionKey];

        return (
            <View style={styles.section} key={sectionKey}>
                <List.Accordion
                    title={title}
                    left={props => <Icon name={icon} size={24} color="#059669" />}
                    expanded={isExpanded}
                    onPress={() => toggleSection(sectionKey)}
                    style={styles.accordion}
                >
                    {sectionAdvisories.map((advisory, idx) => (
                        <View key={advisory.id} style={styles.advisoryItem}>
                            {idx > 0 && <Divider style={styles.divider} />}

                            <View style={styles.advisoryHeader}>
                                <Chip
                                    mode="outlined"
                                    style={[styles.priorityChip, { borderColor: getPriorityColor(advisory.priority) }]}
                                    textStyle={{ color: getPriorityColor(advisory.priority), fontSize: 11 }}
                                >
                                    {advisory.priority.toUpperCase()}
                                </Chip>
                            </View>

                            <Text style={styles.advisoryTitle}>{advisory.title}</Text>
                            <Text style={styles.advisoryDetail}>{advisory.detail}</Text>

                            {/* Fertilizer-specific display */}
                            {advisory.crop_data?.npk && (
                                <View style={styles.npkContainer}>
                                    <Text style={styles.npkLabel}>NPK Requirements:</Text>
                                    <View style={styles.npkValues}>
                                        {advisory.crop_data.npk.n && (
                                            <Chip style={styles.npkChip} textStyle={styles.npkText}>
                                                N: {advisory.crop_data.npk.n} kg/ha
                                            </Chip>
                                        )}
                                        {advisory.crop_data.npk.p && (
                                            <Chip style={styles.npkChip} textStyle={styles.npkText}>
                                                P₂O₅: {advisory.crop_data.npk.p} kg/ha
                                            </Chip>
                                        )}
                                        {advisory.crop_data.npk.k && (
                                            <Chip style={styles.npkChip} textStyle={styles.npkText}>
                                                K₂O: {advisory.crop_data.npk.k} kg/ha
                                            </Chip>
                                        )}
                                    </View>
                                    {advisory.crop_data.method && (
                                        <Text style={styles.methodText}>
                                            <Text style={styles.methodLabel}>Method: </Text>
                                            {advisory.crop_data.method}
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* Pest/Disease-specific display */}
                            {advisory.crop_data?.pests && (
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Common Pests:</Text>
                                    <Text style={styles.infoText}>{advisory.crop_data.pests}</Text>
                                    {advisory.crop_data.control_methods && (
                                        <>
                                            <Text style={[styles.infoLabel, { marginTop: 8 }]}>Control Methods:</Text>
                                            <Text style={styles.infoText}>{advisory.crop_data.control_methods}</Text>
                                        </>
                                    )}
                                </View>
                            )}

                            {advisory.crop_data?.diseases && (
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Common Diseases:</Text>
                                    <Text style={styles.infoText}>{advisory.crop_data.diseases}</Text>
                                    {advisory.crop_data.treatments && (
                                        <>
                                            <Text style={[styles.infoLabel, { marginTop: 8 }]}>Treatments:</Text>
                                            <Text style={styles.infoText}>{advisory.crop_data.treatments}</Text>
                                        </>
                                    )}
                                </View>
                            )}

                            {/* Action buttons */}
                            <View style={styles.actionButtons}>
                                <Button
                                    mode="text"
                                    onPress={() => { }}
                                    compact
                                    labelStyle={styles.buttonLabel}
                                >
                                    Learn More
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={() => onActionComplete?.(advisory.id)}
                                    compact
                                    style={styles.completeButton}
                                    labelStyle={styles.buttonLabel}
                                >
                                    Mark Done
                                </Button>
                            </View>
                        </View>
                    ))}
                </List.Accordion>
            </View>
        );
    };

    return (
        <Card style={styles.card} elevation={3}>
            <Card.Content>
                <View style={styles.header}>
                    <Icon name="sprout-outline" size={28} color="#059669" />
                    <Text style={styles.cropTitle}>{crop}</Text>
                </View>

                <Text style={styles.subtitle}>
                    {advisories.length} {advisories.length === 1 ? 'recommendation' : 'recommendations'} for your crop
                </Text>

                <ScrollView style={styles.scrollContent}>
                    {renderAdvisorySection('Fertilizer & Nutrition', 'sprout', fertilizerAdvisories, 'fertilizer')}
                    {renderAdvisorySection('Pest Management', 'bug', pestAdvisories, 'pests')}
                    {renderAdvisorySection('Disease Prevention', 'shield-alert', diseaseAdvisories, 'diseases')}
                    {renderAdvisorySection('Water & Climate', 'water', waterAdvisories, 'water')}
                    {renderAdvisorySection('Soil Management', 'shovel', soilAdvisories, 'soil')}
                    {renderAdvisorySection('Other Recommendations', 'information', otherAdvisories, 'other')}
                </ScrollView>
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cropTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginLeft: 12,
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    scrollContent: {
        maxHeight: 600,
    },
    section: {
        marginBottom: 8,
    },
    accordion: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    advisoryItem: {
        padding: 12,
        backgroundColor: '#FFFFFF',
    },
    divider: {
        marginVertical: 12,
    },
    advisoryHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 8,
    },
    priorityChip: {
        // height: 24, // Removed to prevent text cutting
        marginRight: 8,
    },
    advisoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 6,
    },
    advisoryDetail: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    npkContainer: {
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    npkLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#065F46',
        marginBottom: 8,
    },
    npkValues: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    npkChip: {
        backgroundColor: '#FFFFFF',
        borderColor: '#059669',
    },
    npkText: {
        fontSize: 12,
        color: '#059669',
    },
    methodText: {
        fontSize: 12,
        color: '#065F46',
        lineHeight: 18,
    },
    methodLabel: {
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: '#78350F',
        lineHeight: 18,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8,
    },
    completeButton: {
        backgroundColor: '#059669',
    },
    buttonLabel: {
        fontSize: 12,
    },
});

export default CropGuidanceCard;
