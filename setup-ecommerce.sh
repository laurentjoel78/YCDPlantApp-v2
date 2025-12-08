#!/bin/bash
# E-commerce Setup Script
# Run this to complete the e-commerce integration

echo "🚀 Starting E-commerce Setup..."
echo ""

# Step 1: Run database migrations
echo "📊 Step 1: Running database migrations..."
cd backend
node migrations/001-create-cart-tables.js

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully!"
else
    echo "❌ Database migrations failed. Please check the error above."
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Restart your backend server: npm run dev"
echo "2. Restart your frontend: npm start (or expo start)"
echo "3. Test the cart flow:"
echo "   - Navigate to Marketplace"
echo "   - Add items to cart"
echo "   - Go to Cart screen"
echo "   - Complete checkout"
echo ""
echo "📚 Documentation:"
echo "- Backend API: backend/README.md"
echo "- Frontend Screens: frontend/src/screens/"
echo "- Walkthrough: .gemini/antigravity/brain/.../ecommerce_complete_walkthrough.md"
echo ""
