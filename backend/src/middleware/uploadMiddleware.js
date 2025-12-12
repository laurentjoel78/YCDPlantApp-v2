const multer = require('multer');

// Use memory storage for cloud deployments (Railway, Heroku, etc.)
// Files are stored as buffers which can be uploaded directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow images and documents for certifications
  if (file.fieldname === 'certifications') {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
    }
  }
  // Allow only images for profile pictures and consultation images
  else if (
    file.fieldname === 'profileImage' ||
    file.fieldname === 'images'
  ) {
    if (
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  } else {
    cb(new Error('Unexpected field name.'));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});
