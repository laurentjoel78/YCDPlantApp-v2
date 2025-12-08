import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Detection = {
    disease: string;
    localName?: { fr?: string; ewondo?: string };
    confidence: number; // 0..1
    urgency?: 'high' | 'moderate' | 'low';
    treatment?: string;
};

export default function DiseaseDetectionCard({ detection, onViewTreatment }: { detection: Detection; onViewTreatment: (d: Detection) => void }) {
    const color = detection.confidence > 0.8 ? '#16A34A' : detection.confidence > 0.6 ? '#F59E0B' : '#DC2626';
    const urgencyText = detection.urgency === 'high' ? 'Élevée' : detection.urgency === 'moderate' ? 'Modérée' : 'Faible';
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{detection.disease}</Text>
                    <Text style={styles.muted}>{detection.localName?.ewondo || detection.localName?.fr || ''}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: color }]}>
                    <Text style={styles.pillText}>{Math.round(detection.confidence * 100)}% sûr</Text>
                </View>
            </View>
            <View style={styles.row}>
                <Text style={styles.muted}>Urgence: {urgencyText}</Text>
            </View>
            {detection.treatment ? (
                <Text numberOfLines={2} style={styles.preview}>{detection.treatment}</Text>
            ) : null}
            <TouchableOpacity style={styles.btn} onPress={() => onViewTreatment(detection)}>
                <Text style={styles.btnText}>Voir le traitement complet</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8 },
    header: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '800', color: '#111827' },
    muted: { color: '#6B7280' },
    pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    pillText: { color: '#fff', fontWeight: '700' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    preview: { color: '#374151' },
    btn: { alignSelf: 'flex-start', backgroundColor: '#2D5016', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    btnText: { color: '#fff', fontWeight: '700' },
});


