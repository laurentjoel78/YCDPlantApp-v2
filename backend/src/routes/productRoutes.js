const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const productController = require('../controllers/productController');
const { auth: protect, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/imageUpload');

// Validation middleware
const productValidation = [
    check('name', 'Product name is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('price', 'Price is required').isNumeric(),
    check('quantity', 'Quantity is required').isNumeric(),
    check('unit', 'Unit is required').not().isEmpty()
];

// Public routes
router.get('/', productController.getProducts);
router.get('/:productId', productController.getProductById);

// Admin routes
router.post(
    '/',
    protect,
    requireAdmin,
    upload.array('images', 5), // Allow up to 5 images
    productValidation,
    productController.createProduct
);

router.put(
    '/:productId',
    protect,
    requireAdmin,
    upload.array('images', 5),
    productController.updateProduct
);

router.delete(
    '/:productId',
    protect,
    requireAdmin,
    productController.deleteProduct
);

module.exports = router;
