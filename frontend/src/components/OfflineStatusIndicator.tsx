import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OfflineStatusIndicator({ isOffline, pendingSync }: { isOffline: boolean; pendingSync: number }) {
    if (!isOffline && pendingSync === 0) return null;
    return (
        <View style={[styles.wrapper, isOffline ? styles.offline : styles.syncing]}>
            <Text style={styles.text}>{isOffline ? 'Mode hors ligne activé' : `Synchronisation... ${pendingSync} en attente`}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { padding: 10, alignItems: 'center' },
    offline: { backgroundColor: '#DC2626' },
    syncing: { backgroundColor: '#6B7280' },
    text: { color: '#fff', fontWeight: '700' },
});


