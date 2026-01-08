import { request } from './api';

export interface DashboardStats {
    users: {
        total: number;
        active: number;
        newThisMonth: number;
        pendingApprovals: number;
        distribution: Record<string, number>;
    };
    products: {
        total: number;
        active: number;
        newThisWeek: number;
    };
    farms: {
        total: number;
        active: number;
    };
    advisories: {
        total: number;
        pending: number;
        completed: number;
    };
    experts: {
        total: number;
    };
}

export interface Activity {
    type: string;
    id: string;
    title: string;
    subtitle: string;
    timestamp: string;
    metadata: Record<string, any>;
}

export interface UserGrowthData {
    date: string;
    count: number;
}

export interface SystemHealth {
    database: {
        status: string;
        latency: number;
        size: string;
    };
    server: {
        status: string;
        uptime: number;
        memory: {
            used: number;
            total: number;
        };
    };
    timestamp: string;
}

class AdminService {
    // Get dashboard statistics
    async getDashboardStats(token: string): Promise<DashboardStats> {
        const response = await request<{ data: DashboardStats }>('/admin/analytics/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }

    // Get user growth data
    async getUserGrowth(token: string, days: number = 30): Promise<UserGrowthData[]> {
        const response = await request<{ data: UserGrowthData[] }>(`/admin/analytics/users/growth?days=${days}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }

    // Get system health
    async getSystemHealth(token: string): Promise<SystemHealth> {
        const response = await request<{ data: SystemHealth }>('/admin/analytics/system/health', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }

    // Get pending user approvals
    async getPendingApprovals(token: string) {
        const response = await request<{ users: any[] }>('/approvals/pending', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.users;
    }

    // Approve or reject user
    async updateApprovalStatus(
        token: string,
        userId: string,
        status: 'approved' | 'rejected',
        reason?: string
    ) {
        const response = await request<any>(`/approvals/${userId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, reason })
        });
        return response;
    }

    // Block user
    async blockUser(token: string, userId: string, reason: string) {
        return await request<any>(`/admin/users/${userId}/block`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ reason })
        });
    }

    // Unblock user
    async unblockUser(token: string, userId: string) {
        return await request<any>(`/admin/users/${userId}/unblock`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Delete user
    async deleteUser(token: string, userId: string) {
        return await request<any>(`/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Update user info
    async updateUser(token: string, userId: string, userData: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        role?: string;
        is_active?: boolean;
        is_verified?: boolean;
    }) {
        return await request<any>(`/admin/users/${userId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(userData)
        });
    }

    // Reset user password (admin)
    async resetUserPassword(token: string, userId: string, options: { newPassword?: string; generateRandom?: boolean }) {
        return await request<{ success: boolean; message: string; data: { userId: string; email: string; temporaryPassword?: string } }>(`/admin/users/${userId}/reset-password`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(options)
        });
    }

    // Delete expert
    async deleteExpert(token: string, expertId: string) {
        return await request<any>(`/admin/experts/${expertId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Delete product
    async deleteProduct(token: string, productId: string) {
        return await request<any>(`/products/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Create expert
    async createExpert(token: string, expertData: any) {

        return await request<any>('/admin/experts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(expertData)
        });
    }

    // Get all users
    async getUsers(token: string, params?: { limit?: number; offset?: number; search?: string; role?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.role) queryParams.append('role', params.role);

        const response = await request<{ success: boolean; data: { rows: any[]; count: number } }>(`/admin/users?${queryParams.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }


    // Create expert with image (FormData)
    async createExpertWithImage(token: string, formData: FormData) {
        // Import API_BASE_URL to use production URL
        const { API_BASE_URL } = await import('../config/constants');

        const response = await fetch(`${API_BASE_URL}/experts`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
                // DO NOT set Content-Type - let browser set it for FormData
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Create forum topic
    async createForumTopic(token: string, topicData: any) {
        return await request<any>('/forums/topics', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(topicData)
        });
    }

    // Get experts list
    async getExperts(token: string, params?: { limit?: number; offset?: number; search?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());
        if (params?.search) queryParams.append('search', params.search);

        return await request<any>(`/experts/search?${queryParams.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Get forum topics
    async getForumTopics(token: string) {
        const response = await request<{ success: boolean; data: { topics: any[]; total: number; page: number; totalPages: number } }>('/forums/topics', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }

    // Activity Monitoring
    async getRecentActivities(token: string, filters?: { actionType?: string; limit?: number; offset?: number }) {
        const params = new URLSearchParams();
        if (filters?.actionType) params.append('actionType', filters.actionType);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        return await request<{ success: boolean; data: { rows: any[]; count: number } }>(`/admin/activities/recent?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    async getUserActivities(token: string, userId: string, limit?: number) {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());

        return await request<{ success: boolean; data: { rows: any[]; count: number } }>(`/admin/users/${userId}/activities?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    async getActivityStats(token: string, timeframe?: string) {
        const params = new URLSearchParams();
        if (timeframe) params.append('timeframe', timeframe);

        return await request<{ success: boolean; data: any }>(`/admin/activities/stats?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
}

export const adminService = new AdminService();
