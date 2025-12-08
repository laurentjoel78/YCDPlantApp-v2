import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { analyzePlantDisease, type DetectionResult } from '../services/diseaseDetectionService';
import { useTranslation } from 'react-i18next';

export default function DiseaseDetectionScreen() {
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState<'front' | 'back'>('back');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const cameraRef = useRef<any>(null);
  const expoCameraModule: any = require('expo-camera');

  const safeKeys = (obj: any) => (obj ? Object.keys(obj) : []);

  const getPath = (obj: any, path: string[]) => {
    try {
      return path.reduce((acc: any, p) => (acc && acc[p] != null ? acc[p] : null), obj);
    } catch (e) {
      return null;
    }
  };

  const candidates = [
    getPath(expoCameraModule, ['CameraView']),
    getPath(expoCameraModule, ['default', 'CameraView']),
    getPath(expoCameraModule, ['Camera']),
    getPath(expoCameraModule, ['default', 'Camera']),
    expoCameraModule,
  ];

  let CameraView: any = candidates.find((c) => typeof c === 'function') || candidates.find((c) => c != null);

  const requestPermFn =
    getPath(expoCameraModule, ['requestCameraPermissionsAsync']) ||
    getPath(expoCameraModule, ['Camera', 'requestCameraPermissionsAsync']) ||
    getPath(expoCameraModule, ['CameraView', 'requestCameraPermissionsAsync']) ||
    getPath(expoCameraModule, ['default', 'requestCameraPermissionsAsync']) ||
    getPath(expoCameraModule, ['default', 'Camera', 'requestCameraPermissionsAsync']) ||
    null;

  useEffect(() => {
    (async () => {
      try {
        let statusResp: any = null;
        if (requestPermFn) {
          statusResp = await requestPermFn();
        } else if (expoCameraModule.requestCameraPermissionsAsync) {
          statusResp = await expoCameraModule.requestCameraPermissionsAsync();
        } else if (getPath(expoCameraModule, ['Camera', 'requestCameraPermissionsAsync'])) {
          statusResp = await getPath(expoCameraModule, ['Camera', 'requestCameraPermissionsAsync'])();
        } else {
          const getPerm = getPath(expoCameraModule, ['CameraView', 'requestCameraPermissionsAsync']) || getPath(expoCameraModule, ['Camera', 'requestCameraPermissionsAsync']);
          if (getPerm) statusResp = await getPerm();
        }
        const { status } = statusResp || {};
        setHasPermission(status === 'granted');
      } catch (err) {
        console.error('Error requesting camera permission:', err);
        setHasPermission(false);
      }
    })();

    return () => {
      if (isCameraActive) {
        setIsCameraActive(false);
      }
    };
  }, []);

  const takePicture = async () => {
    const camera = cameraRef.current;
    if (!camera) return;

    try {
      const photo: CameraCapturedPicture = await camera.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });

      if (photo.uri) {
        setCapturedImage(photo.uri);
        setIsCameraActive(false);
        analyzeImage(photo.uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCapturedImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (imageUri: string): Promise<void> => {
    try {
      setIsAnalyzing(true);
      const analysisResult = await analyzePlantDisease(imageUri);
      setResult(analysisResult);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetDetection = () => {
    setCapturedImage(null);
    setResult(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2D5016" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('detection.noCameraAccess')}</Text>
        <Button mode="contained" onPress={pickImage} style={styles.button}>
          {t('detection.selectFromGallery')}
        </Button>
      </View>
    );
  }

  if (isCameraActive) {
    if (typeof CameraView !== 'function') {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>{t('detection.cameraUnavailable')}</Text>
          <Text>{t('detection.cameraHelp')}</Text>
          <Button mode="contained" onPress={() => setIsCameraActive(false)} style={styles.button}>
            {t('common.back')}
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          type={type}
        />

        <View style={styles.cameraOverlay} pointerEvents="box-none">
          <View style={styles.topControls} />

          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setType(type === 'front' ? 'back' : 'front')}
            >
              <MaterialCommunityIcons name="camera-flip" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsCameraActive(false)}
            >
              <MaterialCommunityIcons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('detection.title')}</Text>

      {!capturedImage ? (
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => setIsCameraActive(true)}
            style={styles.button}
            icon="camera"
          >
            {t('detection.takePhoto')}
          </Button>
          <Button
            mode="outlined"
            onPress={pickImage}
            style={styles.button}
            icon="image"
          >
            {t('detection.chooseFromGallery')}
          </Button>
        </View>
      ) : (
        <ScrollView style={styles.resultContainer} contentContainerStyle={{ paddingBottom: 20 }}>
          <Card style={styles.imageCard}>
            <Card.Cover source={{ uri: capturedImage }} style={styles.capturedImage} />
          </Card>

          {isAnalyzing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2D5016" />
              <Text style={styles.loadingText}>{t('detection.analyzing')}</Text>
            </View>
          ) : result ? (
            <Card style={styles.resultCard}>
              <Card.Content>
                <Text style={styles.diseaseTitle}>{result.disease}</Text>
                <Text style={styles.confidenceText}>
                  {t('detection.confidence', { percent: (result.confidence * 100).toFixed(1) })}
                </Text>
                <Text style={styles.sectionTitle}>{t('detection.description')}</Text>
                <Text style={styles.descriptionText}>{result.description}</Text>
                <Text style={styles.sectionTitle}>{t('detection.recommendedTreatment')}</Text>
                <Text style={styles.treatmentText}>{result.treatment}</Text>
              </Card.Content>
            </Card>
          ) : null}

          <Button
            mode="contained"
            onPress={resetDetection}
            style={styles.button}
            icon="refresh"
          >
            {t('detection.startNew')}
          </Button>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 24,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    height: 60,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    marginVertical: 8,
  },
  cameraControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    height: 100,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  flipButton: {
    padding: 12,
    alignItems: 'center',
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
  },
  resultContainer: {
    flex: 1,
  },
  imageCard: {
    marginBottom: 16,
    alignSelf: 'stretch',
    width: '100%',
  },
  capturedImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5E7EB',
    resizeMode: 'cover',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#2D5016',
  },
  resultCard: {
    marginBottom: 16,
  },
  diseaseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    marginTop: 8,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  treatmentText: {
    fontSize: 14,
    color: '#4B5563',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
});