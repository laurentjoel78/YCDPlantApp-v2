import { api } from './api';

export interface DetectionResult {
  disease: string;
  confidence: number;
  description: string;
  treatment: string;
}

export async function analyzePlantDisease(imageUri: string): Promise<DetectionResult> {
  const formData = new FormData();

  // Extract filename from URI
  const fileName = imageUri.split('/').pop() || 'image.jpg';

  // Append image data
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: fileName,
  } as any);

  try {
    const response = await api.guidance.identifyDisease(formData);

    // The backend response is flattened (check diseaseDetectionController.js line 90)
    // { success: true, disease: ..., confidence: ..., description: ..., treatment: ... }
    return {
      disease: response.disease,
      confidence: response.confidence,
      description: response.description,
      treatment: response.treatment
    };
  } catch (error) {
    console.error('Error analyzing plant disease:', error);
    throw new Error('Failed to analyze plant disease');
  }
}