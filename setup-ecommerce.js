// E-commerce Setup Script for Windows
// Run this with: node setup-ecommerce.js

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting E-commerce Setup...\n');

// Step 1: Run database migrations
console.log('📊 Step 1: Running database migrations...');
try {
    const migrationPath = path.join(__dirname, 'backend', 'migrations', '001-create-cart-tables.js');
    execSync(`node "${migrationPath}"`, { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Database migrations completed successfully!\n');
} catch (error) {
    console.error('❌ Database migrations failed. Please check the error above.');
    process.exit(1);
}

// Step 2: Instructions
console.log('🎉 Setup Complete!\n');
console.log('Next steps:');
console.log('1. Restart your backend server:');
console.log('   cd backend && npm run dev\n');
console.log('2. Restart your frontend:');
console.log('   cd frontend && npm start (or expo start)\n');
console.log('3. Test the cart flow:');
console.log('   - Navigate to Marketplace');
console.log('   - Add items to cart');
console.log('   - Go to Cart screen');
console.log('   - Complete checkout\n');
console.log('📚 Documentation:');
console.log('- Walkthrough: .gemini/antigravity/brain/.../ecommerce_complete_walkthrough.md\n');

process.exit(0);
