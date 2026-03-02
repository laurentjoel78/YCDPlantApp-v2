const multer = require('multer');

// Use memory storage so we can access the buffer for Cloudinary upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept images by mimetype (more reliable than extension for mobile uploads)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
