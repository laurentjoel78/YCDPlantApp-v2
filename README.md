# YCD Farmer Guide

Mobile application for farmers in Cameroon with marketplace, expert consultations, forums, and agricultural resources.

## 📱 Features
- 🛒 E-commerce marketplace
- 👨‍🌾 Expert advisory booking
- 💬 Community forums
- 🌤️ Weather forecasts
- 📚 Agricultural resources
- 🔔 Real-time notifications

## 🏗️ Tech Stack
- **Frontend:** React Native + Expo
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Real-time:** Socket.IO

## 📂 Project Structure
```
YCD_App/
├── frontend/          # React Native mobile app
│   ├── src/
│   │   ├── screens/   # App screens
│   │   ├── components/# Reusable components
│   │   ├── services/  # API & services
│   │   └── context/   # State management
│   └── assets/        # Images & splash screen
│
└── backend/           # Node.js API
    ├── src/
    │   ├── controllers/
    │   ├── models/
    │   ├── routes/
    │   └── services/
    └── config/
```

## 🚀 Setup

### Frontend
```bash
cd frontend
npm install
npx expo start
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## 🌐 Deployment

See [`complete_deployment_guide.md`](https://github.com/LaurentJoel/YCDPlantApp/wiki) for full deployment instructions.

**Free Stack:**
- Mobile: EAS Build
- Backend: Railway ($5/month credit)
- Database: Neon (3GB free)

## 📄 License
MIT

## 👥 Contributors
- Laurent Joel
