import argparse
import json
import torch
from ultralytics import YOLO
from PIL import Image
import numpy as np

def load_model(model_path):
    """Load YOLOv8 model."""
    try:
        model = YOLO(model_path)
        model.to('cuda' if torch.cuda.is_available() else 'cpu')
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {str(e)}")

def process_image(image_path):
    """Load and preprocess image."""
    try:
        image = Image.open(image_path)
        return image
    except Exception as e:
        raise RuntimeError(f"Failed to load image: {str(e)}")

def run_inference(model, image, conf_threshold):
    """Run YOLOv8 inference on image."""
    try:
        # Run inference
        results = model(image, conf=conf_threshold)[0]
        
        # Process results
        detections = []
        for i in range(len(results.boxes)):
            box = results.boxes[i]
            
            # Get bbox coordinates (normalized)
            x1, y1, x2, y2 = box.xyxn[0].tolist()
            
            # Get class and confidence
            cls = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            
            detections.append({
                'bbox': [x1, y1, x2, y2],
                'class': cls,
                'confidence': conf
            })
        
        return detections
    except Exception as e:
        raise RuntimeError(f"Inference failed: {str(e)}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True, help='Path to YOLOv8 model')
    parser.add_argument('--image', required=True, help='Path to input image')
    parser.add_argument('--conf', type=float, default=0.25, help='Confidence threshold')
    args = parser.parse_args()

    try:
        # Load model
        model = load_model(args.model)
        
        # Process image
        image = process_image(args.image)
        
        # Run inference
        detections = run_inference(model, image, args.conf)
        
        # Output results as JSON
        print(json.dumps(detections))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        exit(1)

if __name__ == '__main__':
    main()