import { ForumCategory, ForumPost } from '../types/forum';
import i18n from '../i18n';

// Simple API layer with swappable base URL and mock fallbacks
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

import Constants from 'expo-constants';

// Default to the backend server port used by the project (3000). When running on a device/emulator,
// set EXPO_PUBLIC_API_URL to your machine's LAN IP (e.g. http://192.168.1.10:3000).
// The backend mounts routes under /api, so ensure the base URL includes that prefix.
function makeBaseUrl() {
    // Priority:
    // 1. EXPO_PUBLIC_API_URL (Environment variable, best for EAS Build secrets)
    // 2. Constants.expoConfig.extra.apiUrl (from app.json "extra" section)
    // 3. Fallback to production URL

    // Production Railway URL as default
    const defaultUrl = 'https://ycdplantapp-production.up.railway.app';

    const raw = process.env.EXPO_PUBLIC_API_URL ||
        Constants.expoConfig?.extra?.apiUrl ||
        defaultUrl;

    console.log('[api] Configured API URL source:', raw);

    // remove trailing slash
    const trimmed = raw.replace(/\/$/, '');
    // append /api if not present
    if (/\/api$/.test(trimmed)) return trimmed;
    return `${trimmed}/api`;
}


export const BASE_URL = makeBaseUrl();
// Log the effective base URL to help debug device connectivity
console.log('[api] BASE_URL=', BASE_URL);

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
        // Automatically include auth token if available
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const token = await AsyncStorage.getItem('token'); // Use direct key instead of import

        const headers: Record<string, string> = {
            'Accept-Language': i18n.language || 'fr',
        };

        // Only set Content-Type to json if body is NOT FormData
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('[API] Token present:', token.substring(0, 20) + '...');
        } else {
            console.warn('[API] No token found in storage');
        }

        // Merge with any provided headers
        if (options.headers) {
            Object.assign(headers, options.headers);
        }

        const res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
        });
        const data = await res.text();
        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch {
            // Check if response is empty or non-json
            if (!data) {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return {} as T;
            }
            throw new Error(data || `HTTP ${res.status}`);
        }

        if (!res.ok) {
            throw new Error(parsedData.error || parsedData.message || `HTTP ${res.status}`);
        }
        return parsedData;
    } catch (error: any) {
        if (error.message.includes('Network request failed')) {
            throw new Error('Could not connect to server. Please check your network connection.');
        }
        throw error;
    }
}

// Types
export interface User {
    id: string;
    name: string; // Combined from firstName and lastName
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    first_name?: string;  // Backend returns snake_case
    last_name?: string;   // Backend returns snake_case
    phoneNumber?: string;
    phone_number?: string; // Backend returns snake_case
    region?: string;
    profileImage?: string;
    profile_image_url?: string; // Backend returns snake_case
    approvalStatus?: string;
    approval_status?: string;  // Backend returns snake_case
    emailVerified?: boolean;
    email_verified?: boolean;  // Backend returns snake_case
    farms?: Array<{
        id: string;
        name: string;
        location_lat: number;
        location_lng: number;
    }>;
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    region?: string;
    profileImage?: string;
}

// Public endpoints aligned with the project spec
export const api = {
    auth: {
        login: (email: string, password: string) => request<{ token: string; user: User }>(`/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) }),
        register: (payload: any) => request<{ token: string; user: User }>(`/auth/register`, { method: 'POST', body: JSON.stringify(payload) }),
        profile: (token: string) => request<{ user: User }>(`/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        logout: (token: string) => request<{ message?: string }>(`/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
        updateProfile: async (data: UpdateProfileRequest | FormData) => {
            // Read token from AsyncStorage to include Authorization header
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const token = await AsyncStorage.getItem('token');

            if (data instanceof FormData) {
                return request<{ user: User }>(`/auth/profile`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // Content-Type is automatically set by fetch for FormData
                    },
                    body: data
                });
            }

            // Map camelCase keys used in the frontend to snake_case expected by the backend
            const payload: Record<string, any> = {};
            if (data.firstName !== undefined) payload.first_name = data.firstName;
            if (data.lastName !== undefined) payload.last_name = data.lastName;
            if (data.phoneNumber !== undefined) payload.phone_number = data.phoneNumber;
            if (data.region !== undefined) payload.region = data.region;
            if (data.profileImage !== undefined) payload.profile_image_url = data.profileImage;

            return request<{ user: User }>(`/auth/profile`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
        },
        requestPasswordReset: (email: string) => request<{ message: string; mockMode?: boolean; resetToken?: string; userNotFound?: boolean }>(`/auth/password-reset/request`, { method: 'POST', body: JSON.stringify({ email }) }),
        resetPassword: (token: string, password: string) => request<{ message: string }>(`/auth/password-reset/${token}`, { method: 'POST', body: JSON.stringify({ password }) }),
    },
    guidance: {
        crops: () => request<{ crops: any[] }>(`/crops`),
        identifyDisease: (formData: FormData) => request<{ success: boolean; disease: string; confidence: number; description: string; treatment: string }>(`/disease-detection/detect`, { method: 'POST', body: formData }),
        seasonal: (month: string) => request<{ crops: any[] }>(`/crops/seasonal?month=${encodeURIComponent(month)}`),
    },
    chatbot: {
        sendMessage: (message: string, language: string = 'en', isVoice: boolean = false, farmId?: string) =>
            request<{ success: boolean; data: { text: string; suggestions?: string[]; audioUrl?: string; intent?: string } }>('/chatbot/message', {
                method: 'POST',
                body: JSON.stringify({ message, language, isVoice, farmId })
            }),
    },
    voice: {
        transcribe: (data: { audioBase64: string; language: string; mimeType?: string }) =>
            request<{ status: string; data: { text: string; confidence: number; language: string } }>('/voice/transcribe', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
    },
    suggestions: {
        // Authenticated suggestions (include token in headers)
        get: (token: string) => {
            if (!token) throw new Error('Authentication required');
            return request<any>('/suggestions', {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        // Public suggestions for unauthenticated/dev use
        public: (farmId?: string, email?: string) => {
            if (!farmId || !email) throw new Error('Farm ID and email are required');
            const params: string[] = [];
            params.push(`farm_id=${encodeURIComponent(farmId)}`);
            params.push(`email=${encodeURIComponent(email)}`);
            const q = `?${params.join('&')}`;
            return request<any>(`/suggestions/public${q}`);
        }
    },
    farms: {
        getUserFarms: (token: string) => {
            if (!token) throw new Error('Authentication required');
            return request<{ farms: Array<{ id: string; name: string; location_lat: number; location_lng: number }> }>('/farms', {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        getFarmById: (token: string, farmId: string) => {
            if (!token) throw new Error('Authentication required');
            return request<{ farm: { id: string; name: string; location_lat: number; location_lng: number } }>(`/farms/${farmId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
    },
    weather: {
        byLocation: async (location: string) => {
            try {
                // Forward geocode first
                const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
                const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'YCD-Farmer-Guide/1.0 (contact: app@ycd.local)' } });
                if (!geoRes.ok) throw new Error('Geocoding failed');
                const geoData = await geoRes.json();

                if (!geoData || geoData.length === 0) {
                    throw new Error('Location not found');
                }

                const { lat, lon } = geoData[0];
                // Call backend with coordinates
                return request<any>(`/weather/current?lat=${lat}&lng=${lon}`);
            } catch (error) {
                console.error('Weather by location failed:', error);
                throw error;
            }
        },
        byCoords: async (lat: number, lon: number) => {
            return request<any>(`/weather/current?lat=${lat}&lng=${lon}`);
        },
        reverseGeocode: async (lat: number, lon: number) => {
            // Keep direct call or move to backend if needed, but for now this is fine as it's just for display name
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
            const res = await fetch(url, { headers: { 'User-Agent': 'YCD-Farmer-Guide/1.0 (contact: app@ycd.local)' } });
            if (!res.ok) throw new Error(`Nominatim ${res.status}`);
            return res.json();
        }
    },
    experts: {
        list: () => mockExperts(),
        requestConsultation: (payload: any) => mockSubmit(payload),
    },
    // Marketplace / market (backend mounts under /api/market)
    market: {
        listNearby: () => request<{ markets: any[] }>(`/market/nearby`),
        getMarketProducts: (marketId: string) => request<{ products: any[] }>(`/market/${marketId}/products`),
        // Add product to a market (authenticated)
        addProduct: async (marketId: string, payload: any) => {
            // Read token from AsyncStorage to include Authorization header
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const { STORAGE_KEYS } = await import('../config/constants');
            const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) throw new Error('Authentication required');
            return request<any>(`/market/${marketId}/products`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
        }
    },
    forums: {
        getTopics: () => request<{ success: boolean; data: { topics: ForumCategory[]; total: number; page: number; totalPages: number } }>('/forums/topics'),
        getTopic: (topicId: string, page: number = 1) =>
            request<{ success: boolean; data: { topic: ForumCategory; posts: ForumPost[]; total: number; page: number; totalPages: number } }>
                (`/forums/topics/${topicId}?page=${page}`),
        createTopic: (data: {
            title: string;
            description: string;
            category: string;
            region?: string;
            tags?: string[];
            location?: { latitude: number; longitude: number };
        }) => request<{ success: boolean; data: ForumCategory }>('/forums/topics', { method: 'POST', body: JSON.stringify(data) }),
        createPost: (data: {
            topicId: string;
            content: string;
            title: string;
            tags?: string[];
            images?: string[];
        }) => request<{ success: boolean; data: ForumPost }>(`/forums/topics/${data.topicId}/posts`, { method: 'POST', body: JSON.stringify(data) }),
        report: (data: {
            contentId: string;
            contentType: 'post' | 'comment';
            reason: string;
            details?: string;
        }) => request<void>('/forums/report', { method: 'POST', body: JSON.stringify(data) }),
        search: (params: {
            search?: string;
            category?: string;
            region?: string;
            tags?: string[];
            page?: number;
        }) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (Array.isArray(value)) {
                        value.forEach(v => query.append(key, v));
                    } else {
                        query.append(key, String(value));
                    }
                }
            });
            return request<{ success: boolean; data: { topics: ForumCategory[]; total: number; page: number; totalPages: number } }>(`/forums/topics?${query.toString()}`);
        },
        // Membership endpoints
        joinForum: (forumId: string) => request<{ success: boolean; data: any; message: string }>(`/forums/topics/${forumId}/join`, { method: 'POST' }),
        leaveForum: (forumId: string) => request<{ success: boolean; message: string }>(`/forums/topics/${forumId}/leave`, { method: 'POST' }),
        getMembers: (forumId: string) => request<{ success: boolean; data: any[] }>(`/forums/topics/${forumId}/members`),
        // Chat message endpoints
        getMessages: (forumId: string, page: number = 1, limit: number = 50) =>
            request<{ success: boolean; data: { messages: any[]; total: number; page: number; totalPages: number } }>(`/forums/topics/${forumId}/messages?page=${page}&limit=${limit}`),
        sendMessage: (forumId: string, content: string, messageType: string = 'text') =>
            request<{ success: boolean; data: any }>(`/forums/topics/${forumId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content, messageType })
            }),
        deleteMessage: (messageId: string) =>
            request<{ success: boolean; message: string }>(`/forums/messages/${messageId}`, { method: 'DELETE' })
    },
    cart: {
        get: () => request<{ success: boolean; data: { cart: any; subtotal: number; deliveryFee: number; total: number } }>('/cart'),
        addItem: (productId: string, quantity: number = 1) => request<{ success: boolean; data: any }>('/cart/items', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, quantity })
        }),
        updateItem: (itemId: string, quantity: number) => request<{ success: boolean; data: any }>(`/cart/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        }),
        removeItem: (itemId: string) => request<{ success: boolean; message: string }>(`/cart/items/${itemId}`, {
            method: 'DELETE'
        }),
        clear: () => request<{ success: boolean; message: string }>('/cart', { method: 'DELETE' })
    },
    checkout: {
        createOrder: (data: { deliveryAddress: any; paymentMethod: string; phoneNumber?: string }) =>
            request<{ success: boolean; data: { order: any; payment: any } }>('/checkout', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
        verifyPayment: (orderId: string, paymentReference: string) =>
            request<{ success: boolean; message: string; data: { order: any } }>('/checkout/verify-payment', {
                method: 'POST',
                body: JSON.stringify({ orderId, paymentReference })
            }),
        getOrders: () => request<{ success: boolean; data: { orders: any[] } }>('/orders'),
        getOrderDetails: (orderId: string) => request<{ success: boolean; data: { order: any } }>(`/orders/${orderId}`)
    },
    products: {
        list: () => request<{ products: any[] }>('/products'),
        get: (id: string) => request<{ product: any }>(`/products/${id}`),
    },
    consultations: {
        create: (data: {
            expertId: string;
            problemDescription: string;
            consultationType: 'remote' | 'on_site';
            scheduledDate?: string;
            duration?: number;
        }) => request<{ success: boolean; data: any }>('/consultations', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        bookWithPayment: (data: {
            expertId: string;
            problemDescription: string;
            consultationType: 'remote' | 'on_site';
            scheduledDate: string;
            duration: number;
            paymentMethod: 'mtn' | 'orange';
            phoneNumber: string;
            totalCost: number;
        }) => request<{ success: boolean; data: { consultation: any; payment: any } }>('/consultations/book-with-payment', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        list: () => request<{ success: boolean; data: { consultations: any[] } }>('/consultations'),
        get: (id: string) => request<{ success: boolean; data: { consultation: any } }>(`/consultations/${id}`),
        rate: (consultationId: string, rating: number, comment?: string) =>
            request<{ success: boolean; data: any }>(`/consultations/${consultationId}/rate`, {
                method: 'POST',
                body: JSON.stringify({ rating, comment })
            }),
        verifyPayment: (consultationId: string, paymentReference: string) =>
            request<{ success: boolean; message: string; data: any }>('/consultations/verify-payment', {
                method: 'POST',
                body: JSON.stringify({ consultationId, paymentReference })
            })
    },
};

// ---- Mock adapters (replace with real endpoints later) ----
async function mockExperts() {
    return {
        experts: [
            { id: '1', name: 'Dr. Kengne', rating: 4.8, totalConsultations: 124, hourlyRate: 18000, isAvailable: true, specializations: ['Cacao', 'Maladies fongiques', 'Soil'], availableLanguages: ['Français', 'Ewondo'] },
            { id: '2', name: 'Mme. Nguimatsia', rating: 4.6, totalConsultations: 89, hourlyRate: 20000, isAvailable: false, specializations: ['Maïs', 'Pestes', 'Engrais'], availableLanguages: ['Français', 'Bassa'] },
        ]
    };
}

async function mockSubmit(payload: any) {
    console.log('Mock submit expert request:', payload);
    return { ok: true, requestId: `${Date.now()}` };
}
