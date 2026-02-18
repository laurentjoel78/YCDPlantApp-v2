import { request } from './api';
import MMKVStorage from '../utils/storage';

export interface Farm {
  id: string;
  name: string;
  size_hectares: number;
  main_crops: string[];
  location_lat?: number;
  location_lng?: number;
  soil_type?: string;
  created_at: string;
  updated_at: string;
}

export const farmService = {
  getUserFarms: async (userId: string) => {
    // Read token from MMKV - support both keys used in the app
    const token = (await MMKVStorage.getItem('token')) || (await MMKVStorage.getItem('authToken')) || undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    // Backend exposes authenticated farms at GET /farms (uses req.user from token)
    // so call that instead of /farms/user/:id to avoid needing the userId in the path.
    return request<{ farms: Farm[] }>(`/farms`, {
      method: 'GET',
      headers,
    });
  },
  
  getFarm: (farmId: string) => request<{ farm: Farm }>(`/farms/${farmId}`, {
    method: 'GET',
  }),
  
  createFarm: (data: Partial<Farm>) => request<{ farm: Farm }>('/farms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateFarm: (farmId: string, data: Partial<Farm>) => request<{ farm: Farm }>(`/farms/${farmId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteFarm: (farmId: string) => request<void>(`/farms/${farmId}`, {
    method: 'DELETE',
  }),
};