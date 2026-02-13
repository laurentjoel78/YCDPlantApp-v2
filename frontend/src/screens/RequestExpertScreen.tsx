import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ExpertCard } from '../components/ExpertCard';
import { ChatInput } from '../components/ChatInput';
import { ChatMessage, MessageType } from '../components/ChatMessage';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useTranslation } from 'react-i18next';

type UrgencyLevel = 'normal' | 'high' | 'emergency';
type ConsultationType = 'virtual' | 'on_site' | 'phone';

const formatCurrency = (amount: number): string => new Intl.NumberFormat('fr-FR').format(Math.round(amount));

export default function RequestExpertScreen() {
    const [selectedSpecialization, setSelectedSpecialization] = useState('crop_diseases');
    const [problemDescription, setProblemDescription] = useState('');
    const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('normal');
    const [consultationType, setConsultationType] = useState<ConsultationType>('virtual');
    const [maxBudget, setMaxBudget] = useState(50000);
    const { isRecording, transcription, error, startRecording, stopRecording } = useVoiceRecognition();
    const { t } = useTranslation();
    const [messages, setMessages] = useState<Array<{ id: string; message: string; type: MessageType; timestamp: Date }>>([
        {
            id: '1',
            message: t(('expert.chat.welcome') as any),
            type: 'bot',
            timestamp: new Date()
        }
    ]);
    
    const scrollViewRef = useRef<ScrollView>(null);
    const availableExperts = MOCK_EXPERTS;

    const estimatedCost = useMemo(() => {
        const baseRate = consultationType === 'on_site' ? 25000 : consultationType === 'phone' ? 12000 : 15000;
        const urgencyMultiplier = urgencyLevel === 'emergency' ? 1.5 : urgencyLevel === 'high' ? 1.25 : 1;
        const commissionRate = 0.20;
        const expertFee = baseRate * urgencyMultiplier;
        const commission = expertFee * commissionRate;
        return { total: expertFee + commission, expertFee, commission };
    }, [consultationType, urgencyLevel]);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{t(('expert.request.title') as any)}</Text>
            <Text style={styles.subtitle}>{t(('expert.request.subtitle') as any)}</Text>

            <View style={styles.section}>
                <Text style={styles.label}>{t(('expert.request.type') as any)}</Text>
                <View style={styles.inlineChips}>
                    {SPEC_OPTIONS.map(o => (
                        <Chip key={o.value} label={o.label} active={selectedSpecialization === o.value} onPress={() => setSelectedSpecialization(o.value)} />
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>{t(('expert.request.describe') as any)}</Text>
                <TextInput
                    style={styles.textArea}
                    multiline
                    placeholder={t(('expert.request.examplePlaceholder') as any)}
                    value={problemDescription}
                    onChangeText={setProblemDescription}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>{t(('expert.request.consultationType') as any)}</Text>
                <View style={styles.inlineChips}>
                    {CONSULT_OPTIONS.map(o => (
                        <Chip key={o.value} label={o.label} active={consultationType === o.value} onPress={() => setConsultationType(o.value as ConsultationType)} />
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>{t(('expert.request.urgencyLevel') as any)}</Text>
                <View style={styles.inlineChips}>
                    {URGENCY_OPTIONS.map(o => (
                        <Chip key={o.value} label={o.label} active={urgencyLevel === o.value} onPress={() => setUrgencyLevel(o.value as UrgencyLevel)} />
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>{t(('expert.request.maxBudget') as any)}</Text>
                <TextInput
                    keyboardType="numeric"
                    value={String(maxBudget)}
                    onChangeText={(t) => setMaxBudget(Number(t.replace(/\D/g, '')) || 0)}
                    style={styles.input}
                />
                <Text style={styles.muted}>{t(('expert.request.selectedBudget') as any)}: {formatCurrency(maxBudget)} FCFA</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>{t(('expert.request.estimatedCost') as any)}</Text>
                <View style={styles.cardRow}>
                    <Text>{t(('expert.request.expertFee') as any)}</Text>
                    <Text>{formatCurrency(estimatedCost.expertFee)} FCFA</Text>
                </View>
                <View style={styles.cardRow}>
                    <Text>{t(('expert.request.commission') as any)}</Text>
                    <Text>{formatCurrency(estimatedCost.commission)} FCFA</Text>
                </View>
                <View style={[styles.cardRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>{t(('expert.request.totalEstimated') as any)}</Text>
                    <Text style={styles.totalValue}>{formatCurrency(estimatedCost.total)} FCFA</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>{t(('expert.request.availableExperts') as any)}</Text>
                <View style={{ gap: 12 }}>
                    {availableExperts.map((e) => (
                        <ExpertCard key={e.id} expert={e} onPress={() => { }} />
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => { /* submit request later */ }}>
                <Text style={styles.primaryBtnText}>{t(('expert.request.submitRequest') as any)}</Text>
            </TouchableOpacity>

            <View style={styles.chatSection}>
                <Text style={styles.label}>{t(('expert.chat.title') as any)}</Text>
                <View style={styles.chatContainer}>
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.chatMessages}
                        contentContainerStyle={styles.chatMessagesContent}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    >
                        {messages.map((msg) => (
                            <ChatMessage
                                key={msg.id}
                                message={msg.message}
                                type={msg.type}
                                timestamp={msg.timestamp}
                            />
                        ))}
                    </ScrollView>
                    <ChatInput
                        onSend={(message) => {
                            const newMessage = {
                                id: Date.now().toString(),
                                message,
                                type: 'user' as MessageType,
                                timestamp: new Date()
                            };
                            setMessages(prev => [...prev, newMessage]);
                            // Here you would typically trigger your chatbot response
                                setTimeout(() => {
                                setMessages(prev => [...prev, {
                                    id: (Date.now() + 1).toString(),
                                    message: t(('expert.chat.acknowledge') as any),
                                    type: 'bot',
                                    timestamp: new Date()
                                }]);
                            }, 1000);
                        }}
                        onStartVoice={async () => {
                            try {
                                await startRecording();
                            } catch (err) {
                                Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement vocal');
                            }
                        }}
                        onStopVoice={async () => {
                            try {
                                await stopRecording();
                                if (transcription) {
                                    const transcribedText = transcription;
                                    const newMessage = {
                                        id: Date.now().toString(),
                                        message: transcribedText,
                                        type: 'user' as MessageType,
                                        timestamp: new Date()
                                    };
                                    setMessages(prev => [...prev, newMessage]);
                                }
                            } catch (err) {
                                Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement vocal');
                            }
                        }}
                        isRecording={isRecording}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

interface ChipProps {
    label: string;
    active: boolean;
    onPress: () => void;
}

function Chip({ label, active, onPress }: ChipProps) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

const SPEC_OPTIONS = [
    { label: 'Maladies des cultures', value: 'crop_diseases' },
    { label: 'Cacao', value: 'cacao' },
    { label: 'Café', value: 'coffee' },
    { label: 'Maïs', value: 'corn' },
    { label: 'Manioc', value: 'cassava' },
    { label: 'Gestion des sols', value: 'soil_management' },
];

const CONSULT_OPTIONS = [
    { value: 'virtual', label: 'Virtuelle' },
    { value: 'on_site', label: 'Sur site' },
    { value: 'phone', label: 'Téléphone' },
];

const URGENCY_OPTIONS = [
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Urgent' },
    { value: 'emergency', label: 'Urgence' },
];

const MOCK_EXPERTS = [
    { 
        id: '1', 
        name: 'Dr. Kengne', 
        rating: 4.8, 
        totalConsultations: 124, 
        hourlyRate: 18000, 
        isAvailable: true, 
        specializations: ['Cacao', 'Maladies fongiques', 'Soil'], 
        specialty: 'Cacao',
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
        experience: '15 ans',
        consultationFee: 18000,
        availability: {
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            hours: '08:00-17:00'
        },
        bio: 'Expert en cacaoculture avec plus de 15 ans d\'expérience. Spécialisé dans le diagnostic et le traitement des maladies du cacao.',
        languages: ['Français', 'Ewondo', 'Anglais'],
        certifications: [
            'PhD en Agronomie - Université de Yaoundé I (2010)',
            'Expert Certifié en Pathologie Végétale - IRAD (2015)'
        ],
        availableLanguages: ['Français', 'Ewondo']
    },
    { 
        id: '2', 
        name: 'Mme. Nguimatsia', 
        rating: 4.6, 
        totalConsultations: 89, 
        hourlyRate: 20000, 
        isAvailable: false, 
        specializations: ['Maïs', 'Pestes', 'Engrais'], 
        specialty: 'Maïs',
        image: 'https://randomuser.me/api/portraits/women/2.jpg',
        experience: '12 ans',
        consultationFee: 20000,
        availability: {
            days: ['monday', 'wednesday', 'friday'],
            hours: '09:00-16:00'
        },
        bio: 'Experte en culture du maïs et gestion intégrée des ravageurs. Formation spécialisée en agriculture durable.',
        languages: ['Français', 'Bassa', 'Anglais'],
        certifications: [
            'MSc en Protection des Cultures - FASA Dschang (2013)',
            'Certification en Agriculture Durable - MINADER (2018)'
        ],
        availableLanguages: ['Français', 'Bassa']
    },
];

const styles = StyleSheet.create({
    container: { padding: 16, gap: 16, paddingBottom: 0 },
    title: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
    subtitle: { color: '#6B7280' },
    chatSection: {
        marginTop: 16,
        marginHorizontal: -16,
        borderTopWidth: 8,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    chatContainer: {
        height: 400,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    chatMessages: {
        flex: 1,
        backgroundColor: '#fff',
    },
    chatMessagesContent: {
        padding: 16,
        gap: 8,
    },
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8 },
    label: { fontWeight: '700', color: '#374151' },
    textArea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, minHeight: 90 },
    inlineChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    chipActive: { backgroundColor: '#2D5016', borderColor: '#2D5016' },
    chipText: { color: '#374151' },
    chipTextActive: { color: '#fff', fontWeight: '700' },
    input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10 },
    muted: { color: '#6B7280' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    totalRow: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 6, paddingTop: 6 },
    totalLabel: { fontWeight: '800' },
    totalValue: { fontWeight: '800' },
    primaryBtn: { backgroundColor: '#2D5016', borderRadius: 12, alignItems: 'center', padding: 14, marginBottom: 20 },
    primaryBtnText: { color: '#fff', fontWeight: '800' },
});
