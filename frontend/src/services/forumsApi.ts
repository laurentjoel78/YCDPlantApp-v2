import { request } from '../services/api';

interface NearbyTopicsParams {
  latitude: number;
  longitude: number;
  radius?: number;
  page?: number;
  limit?: number;
}

interface TopicResponse {
  success: boolean;
  data: {
    topics: Array<{
      id: string;
      title: string;
      description: string;
      distance: number;
      lastActivityAt: string;
      author: {
        id: string;
        name: string;
        avatar?: string;
      };
    }>;
    total: number;
    page: number;
    totalPages: number;
  };
}

export class ForumsApi {
  async getNearbyTopics(params: NearbyTopicsParams): Promise<TopicResponse> {
    const { latitude, longitude, radius, page, limit } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('latitude', latitude.toString());
    queryParams.append('longitude', longitude.toString());
    if (radius) queryParams.append('radius', radius.toString());
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());

    return request<TopicResponse>(`/forums/nearby?${queryParams.toString()}`);
  }
}

export const forumsApi = new ForumsApi();