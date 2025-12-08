# YCD Farmer Guide Backend

## Project Structure

```
src/
├── controllers/      # Route controllers (controller layer)
├── services/        # Business logic (service layer)
├── models/          # Database models
├── routes/          # Routes
├── middleware/      # Custom middleware
├── utils/          # Utility classes and functions
├── config/         # Configuration files
└── index.js        # App entry point
```

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (copy `.env.example` to `.env`)
4. Start development server: `npm run dev`
5. Run tests: `npm test`

## Database Setup

1. Create PostgreSQL database
2. Update database configuration in `.env`
3. Run migrations: `npm run migrate`

## API Documentation

Detailed API documentation can be found in the `/docs` directory.
