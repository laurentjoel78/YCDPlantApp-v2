const { Product, User, Farm, Crop } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { uploadImage, deleteImage } = require('../services/uploadService');
const auditService = require('../services/auditService');
const socketService = require('../services/socketService');

// Create a new product listing (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can create product listings' });
    }

    let imageUrls = [];

    // Only attempt file upload if files are present
    if (req.files && req.files.length > 0) {
      try {
        const { uploadImage } = require('../services/uploadService');

        const uploadPromises = req.files.map(async file => {
          // Use uploadImage with buffer (memory storage)
          const result = await uploadImage(file.buffer, 'ycd_products');
          return result;
        });

        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map(result => result.secure_url);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        // Continue without images if upload fails
      }
    } else if (req.body.images) {
      // Handle URL-based images passed in body
      imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // Note: Products can be created without images - imageUrls will be empty array


    const productData = {
      seller_id: req.user.id,
      name: req.body.name,
      description: req.body.description,
      quantity: req.body.quantity,
      unit: req.body.unit,
      price: req.body.price,
      category: req.body.category,
      images: imageUrls,
      market_name: req.body.market_name || null,
      status: req.body.status || 'active'
    };

    const product = await Product.create(productData);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'PRODUCT_CREATE',
      actionDescription: `Created product listing: ${product.name}`,
      req,
      tableName: 'products',
      recordId: product.id,
      metadata: { name: product.name, category: product.category, price: product.price }
    });

    socketService.emitToAll('PRODUCT_CREATE', { product });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({ error: 'Failed to create product listing' });
  }
};

// Get all products (with filters)
exports.getProducts = async (req, res) => {
  try {
    const { status, category, min_price, max_price, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (min_price) where.price = { [Op.gte]: min_price };
    if (max_price) where.price = { ...where.price, [Op.lte]: max_price };
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const products = await Product.findAll({
      where,
      include: [{ model: User, as: 'seller', attributes: ['id', 'first_name', 'last_name'] }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.productId },
      include: [{ model: User, as: 'seller', attributes: ['id', 'first_name', 'last_name'] }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Update product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can update products' });
    }

    const product = await Product.findOne({ where: { id: req.params.productId } });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let imageUrls = product.images || [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file.buffer));
      const uploadResults = await Promise.all(uploadPromises);
      const newImageUrls = uploadResults.map(result => result.secure_url);
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    const updateData = {
      name: req.body.name || product.name,
      description: req.body.description || product.description,
      quantity: req.body.quantity || product.quantity,
      unit: req.body.unit || product.unit,
      price: req.body.price || product.price,
      category: req.body.category || product.category,
      images: imageUrls,
      market_name: req.body.market_name !== undefined ? req.body.market_name : product.market_name,
      status: req.body.status || product.status
    };

    const oldValues = {
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      status: product.status
    };

    await product.update(updateData);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'PRODUCT_UPDATE',
      actionDescription: `Updated product listing: ${product.name}`,
      req,
      tableName: 'products',
      recordId: product.id,
      oldValues,
      newValues: updateData
    });

    socketService.emitToAll('PRODUCT_UPDATE', { product });

    res.status(200).json({ product });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete products' });
    }

    const product = await Product.findOne({ where: { id: req.params.productId } });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { CartItem } = require('../models');
    await CartItem.destroy({ where: { product_id: req.params.productId } });

    await product.destroy();

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'PRODUCT_DELETE',
      actionDescription: `Deleted product listing: ${product.name}`,
      req,
      tableName: 'products',
      recordId: product.id,
      metadata: { name: product.name }
    });

    socketService.emitToAll('PRODUCT_DELETE', { productId: product.id });

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};