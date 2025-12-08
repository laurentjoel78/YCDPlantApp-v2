import { request } from './api';

export interface GuidelineTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  type: string;
  durationDays: number;
  basePriority: number;
  soilTypes: string[];
  climateZones: string[];
  seasons: string[];
  conditions?: {
    temperature_c?: {
      min?: number;
      max?: number;
    };
    rainfall_mm?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FarmGuideline {
  id: string;
  farmId: string;
  templateId: string;
  status: 'active' | 'completed' | 'archived';
  progress: number;
  startDate: string;
  targetDate: string;
  actualCompletionDate?: string;
  notes?: string;
  customizations?: {
    adjustedInstructions?: string;
    localConsiderations?: {
      climateZone: string;
      weatherPatterns: any;
      commonPests: string[];
      soilCharacteristics: any;
    };
    weatherWarnings?: string[];
    soilRecommendations?: string[];
  };
  template: GuidelineTemplate;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuidelineRequest {
  farmId: string;
  templateId: string;
  startDate: string;
  targetDate: string;
  notes?: string;
  customizations?: FarmGuideline['customizations'];
}

export interface GuidelineUpdateData {
  progress?: number;
  status?: FarmGuideline['status'];
  notes?: string;
  customizations?: FarmGuideline['customizations'];
  actualCompletionDate?: string;
}

export interface GuidelineResponse {
  success: boolean;
  guideline: FarmGuideline;
  message?: string;
}

export interface GuidelinesResponse {
  success: boolean;
  guidelines: FarmGuideline[];
  message?: string;
}

export const guidelineService = {
  getTemplates: () => request<{ templates: GuidelineTemplate[] }>('/guidelines/templates', {
    method: 'GET'
  }),
  
  getTemplate: (templateId: string) => request<{ template: GuidelineTemplate }>(`/guidelines/templates/${templateId}`, {
    method: 'GET'
  }),
  
  getFarmGuidelines: (farmId: string) => request<{ guidelines: FarmGuideline[] }>(`/guidelines/farm/${farmId}`, {
    method: 'GET'
  }),

  // Backwards-compatible helper used by UI components
  getGuidelines: async (farmId?: string) => {
    // If farmId provided, call farm-specific endpoint; otherwise return templates wrapper
    if (farmId) {
      return await guidelineService.getFarmGuidelines(farmId);
    }
    // Return empty shape to satisfy callers when no farmId
    return { guidelines: [] as FarmGuideline[] };
  },

  getGuideline: async (guidelineId: string) => {
    return request<{ guideline: FarmGuideline }>(`/guidelines/${guidelineId}`, {
      method: 'GET'
    });
  },
  
  createGuideline: (data: CreateGuidelineRequest) => request<{ guideline: FarmGuideline }>('/guidelines', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  updateGuideline: (guidelineId: string, data: GuidelineUpdateData) => request<{ guideline: FarmGuideline }>(`/guidelines/${guidelineId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  deleteGuideline: (guidelineId: string) => request<void>(`/guidelines/${guidelineId}`, {
    method: 'DELETE'
  }),
  
  getRecommendations: (farmId: string) => request<{ recommendations: GuidelineTemplate[] }>(`/guidelines/recommendations/${farmId}`, {
    method: 'GET'
  })
};