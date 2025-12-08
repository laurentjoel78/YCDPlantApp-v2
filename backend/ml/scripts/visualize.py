import argparse
import json
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def draw_detections(image_path, detections, output_path):
    """Draw detection boxes and labels on the image."""
    try:
        # Load image
        image = Image.open(image_path)
        draw = ImageDraw.Draw(image)
        
        # Load font (fallback to default if custom font not available)
        try:
            font = ImageFont.truetype("arial.ttf", 16)
        except:
            font = ImageFont.load_default()

        # Colors for different severity levels
        colors = {
            'severe': '#FF0000',   # Red
            'moderate': '#FFA500', # Orange
            'mild': '#FFFF00'      # Yellow
        }

        # Draw each detection
        for det in detections:
            # Get coordinates
            x1, y1, x2, y2 = det['bbox']
            
            # Convert normalized coordinates to actual pixels
            width, height = image.size
            x1, x2 = x1 * width, x2 * width
            y1, y2 = y1 * height, y2 * height
            
            # Determine color based on confidence
            conf = det['confidence']
            color = colors['severe'] if conf > 0.8 else \
                   colors['moderate'] if conf > 0.6 else \
                   colors['mild']
            
            # Draw bounding box
            draw.rectangle([x1, y1, x2, y2], outline=color, width=2)
            
            # Draw label
            label = f"{det.get('disease', 'Unknown')} ({conf:.2f})"
            label_size = draw.textsize(label, font=font)
            draw.rectangle([x1, y1 - label_size[1], x1 + label_size[0], y1],
                         fill=color)
            draw.text((x1, y1 - label_size[1]), label, fill='black', font=font)

        # Save output image
        image.save(output_path, quality=95)
        return True
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True, help='Path to input image')
    parser.add_argument('--detections', required=True, help='JSON string of detections')
    parser.add_argument('--output', required=True, help='Path to output visualization')
    args = parser.parse_args()

    try:
        detections = json.loads(args.detections)
        success = draw_detections(args.image, detections, args.output)
        exit(0 if success else 1)
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        exit(1)

if __name__ == '__main__':
    main()