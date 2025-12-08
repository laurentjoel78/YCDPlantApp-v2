import { BASE_URL } from './api';
import { getStoredToken } from '../utils/authStorage';

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
    const token = await getStoredToken();

    const response = await fetch(`${BASE_URL}/disease-detection/detect`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze plant disease: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing plant disease:', error);
    throw new Error('Failed to analyze plant disease');
  }
}