const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload an image buffer to Cloudinary
 * @param {Buffer} buffer - The image file buffer
 * @param {string} folder - The folder to upload to (default: 'ycd_products')
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
const uploadImage = (buffer, folder = 'ycd_products') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - The Cloudinary deletion result
 */
const deleteImage = async (publicId) => {
    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    deleteImage
};

/**
 * Upload a file from path to Cloudinary
 * @param {string} filePath - The file path
 * @param {string} folder - The folder to upload to
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
const uploadFile = async (filePath, folder = 'ycd_products') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto'
        });
        return result;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    uploadImage,
    uploadFile,
    deleteImage
};
