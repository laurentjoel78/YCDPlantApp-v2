const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

class ImageUploadService {
  constructor() {
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, './uploads/plants');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        cb(null, 'plant-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
      },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      }
    });
  }

  async saveBase64Image(base64String, userId) {
    try {
      // Remove data:image/jpeg;base64, from the string if present
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate unique filename
      const filename = `plant-${uuidv4()}.jpg`;
      const filepath = path.join('./uploads/plants', filename);

      // Process image with sharp
      await sharp(buffer)
        .resize(800, 800, { // Resize to reasonable dimensions
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 }) // Compress to save space
        .toFile(filepath);

      return {
        filename,
        filepath,
        mimetype: 'image/jpeg'
      };
    } catch (error) {
      throw new Error(`Failed to save camera image: ${error.message}`);
    }
  }

  async processUploadedImage(file) {
    try {
      // Process uploaded file with sharp
      const processedFilename = `processed-${file.filename}`;
      const processedFilepath = path.join('./uploads/plants', processedFilename);

      await sharp(file.path)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(processedFilepath);

      // Remove original unprocessed file
      await fs.unlink(file.path);

      return {
        filename: processedFilename,
        filepath: processedFilepath,
        mimetype: file.mimetype
      };
    } catch (error) {
      throw new Error(`Failed to process uploaded image: ${error.message}`);
    }
  }

  async validateImage(filepath) {
    try {
      // Validate image dimensions and format
      const metadata = await sharp(filepath).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      };
    } catch (error) {
      throw new Error(`Image validation failed: ${error.message}`);
    }
  }

  getUploadMiddleware() {
    return this.upload.single('image');
  }
}

module.exports = new ImageUploadService();