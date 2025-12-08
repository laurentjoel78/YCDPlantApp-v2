export interface GuidelineTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  type: string;
  durationDays: number;
  basePriority: number;
  conditions?: {
    soil_type?: string[];
    temperature_c?: {
      min?: number;
      max?: number;
    };
    rainfall_mm?: number;
    seasons?: string[];
  };
}

export interface FarmGuideline {
  id: string;
  farmId: string;
  templateId: string;
  template: GuidelineTemplate;
  startDate: string;
  targetDate: string;
  status: 'active' | 'completed' | 'overdue';
  progress: number;
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

export interface GuidelineUpdateData {
  progress?: number;
  notes?: string;
  status?: FarmGuideline['status'];
}