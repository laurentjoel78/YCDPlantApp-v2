import { API_BASE_URL } from '../config/constants';
import { request } from './api';

export const productService = {
    async getAllProducts(token: string) {
        return await request<any>('/products', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    async createProduct(token: string, productData: FormData) {
        // Use fetch directly for FormData to let browser/native handle Content-Type boundary
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                // Do NOT set Content-Type here, let FormData handle it
            },
            body: productData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create product');
        }

        return await response.json();
    },

    async deleteProduct(token: string, productId: string) {
        return await request<any>(`/products/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};
