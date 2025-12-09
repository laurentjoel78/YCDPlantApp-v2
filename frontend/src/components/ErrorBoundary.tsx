import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleRestart = async () => {
        try {
            await Updates.reloadAsync();
        } catch (e) {
            // Fallback if expo-updates isn't available (e.g. specific dev modes)
            this.setState({ hasError: false, error: null, errorInfo: null });
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={styles.container}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#D32F2F" />
                        </View>

                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.message}>
                            We encountered an unexpected error. Please try restarting the app.
                        </Text>

                        <View style={styles.errorBox}>
                            <Text style={styles.errorLabel}>Error Details:</Text>
                            <Text style={styles.errorText}>
                                {this.state.error?.toString()}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
                            <Text style={styles.buttonText}>Restart App</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={() => this.setState({ hasError: false })}
                        >
                            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Try Again</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    errorBox: {
        backgroundColor: '#FFEBEE',
        padding: 16,
        borderRadius: 8,
        width: '100%',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    errorLabel: {
        color: '#D32F2F',
        fontWeight: 'bold',
        marginBottom: 8,
        fontSize: 12,
        textTransform: 'uppercase',
    },
    errorText: {
        color: '#D32F2F',
        fontFamily: 'monospace',
        fontSize: 12,
    },
    button: {
        backgroundColor: '#2E7D32',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#2E7D32',
        elevation: 0,
    },
    secondaryButtonText: {
        color: '#2E7D32',
    },
});
