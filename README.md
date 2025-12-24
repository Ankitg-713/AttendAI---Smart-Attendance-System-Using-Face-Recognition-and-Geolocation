# 🎓 AttendAI - AI-Powered Smart Attendance System

<div align="center">

![AttendAI Banner](https://img.shields.io/badge/AttendAI-Smart%20Attendance-cyan?style=for-the-badge&logo=artificial-intelligence)

**An intelligent attendance management system using Facial Recognition & GPS Geolocation**

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-face--api-FF6F00?style=flat-square&logo=tensorflow)](https://www.tensorflow.org/js)

[Features](#-key-features) • [Demo](#-demo-credentials) • [Installation](#-quick-start) • [Deployment](#-deployment) • [Documentation](#-project-report)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Key Features](#-key-features)
- [Demo Credentials](#-demo-credentials)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [API Endpoints](#-api-endpoints)
- [Security](#-security-features)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Project Report](#-project-report)
- [Troubleshooting](#-troubleshooting)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

---

## 🎯 About

**AttendAI** eliminates proxy attendance through a multi-layered verification system that combines:

- 🤖 **AI-Powered Face Recognition** - Client-side biometric verification using TensorFlow.js
- 📍 **GPS Geolocation** - 50-meter radius verification around classroom
- ⏰ **Time Validation** - Attendance only during scheduled class hours
- 🔐 **Role-Based Access** - Separate dashboards for Students, Teachers & Admins

### Why AttendAI?

| Traditional Methods | AttendAI |
|---------------------|----------|
| ❌ Proxy attendance possible | ✅ Face + Location verification |
| ❌ 10-15 min roll call | ✅ Instant marking |
| ❌ Manual errors | ✅ Automated & accurate |
| ❌ No real-time analytics | ✅ Live dashboards |
| ❌ Paper records | ✅ Digital audit trail |

---

## ✨ Key Features

### 🔐 Multi-Layer Security
- **Face Recognition** - AI-powered biometric verification using face-api.js
- **GPS Verification** - Students must be within 50m of class location
- **Time Validation** - Attendance only during scheduled class hours
- **Late Detection** - Auto-marks attendance as "Late" after grace period
- **JWT Authentication** - Secure token-based auth with 2-hour expiry
- **Rate Limiting** - Protection against brute-force attacks

### 📱 Student Features
- Register with face capture
- Mark attendance with real-time verification
- View subject-wise attendance analytics with doughnut charts
- Track attendance percentage & eligibility status
- **Export attendance report to PDF** 📄
- Auto-refresh pending classes list

### 👨‍🏫 Teacher Features
- Schedule classes with auto-captured GPS location
- View and manually edit attendance records
- Subject-wise analytics dashboard
- Filter by month or view overall statistics
- **Export class attendance to PDF** 📄
- Cancel scheduled classes

### 🏫 Admin Features
- Assign teachers to subjects
- Manage system users
- Oversee all classes and attendance

### 🎨 Modern UI/UX
- **Futuristic Dark Theme** - Cyber-inspired design with animations
- **Framer Motion Animations** - Smooth transitions & micro-interactions
- **Glassmorphism Effects** - Modern translucent cards
- **Responsive Design** - Works on mobile, tablet & desktop
- **Real-time Toast Notifications** - Instant feedback

### 📊 Analytics & Reporting
- Subject-wise attendance breakdown
- Eligibility status tracking (75% threshold)
- Late vs Present statistics
- Monthly attendance views
- **PDF Report Generation** - Export attendance data

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **👑 Admin** | `admin@example.com` | `admin@123` |
| **👨‍🏫 Teacher** | `rohanjha6881@gmail.com` | `123456` |
| **🎓 Student** | `ankitgupta6881@gmail.com` | `123456` |

> 💡 Run `node backend/scripts/seedData.js` to create these demo accounts.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI Framework |
| Vite | 7.0.4 | Build Tool |
| Tailwind CSS | 4.1.11 | Styling |
| Framer Motion | 11.x | Animations |
| face-api.js | 0.22.2 | Face Recognition (TensorFlow.js) |
| Chart.js | 4.5.0 | Data Visualization |
| jsPDF | 2.x | PDF Generation |
| React Router | 7.7.1 | Routing |
| Axios | 1.11.0 | HTTP Client |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 16+ | Runtime |
| Express | 5.1.0 | Web Framework |
| MongoDB | 5.0+ | Database |
| Mongoose | 8.16.5 | ODM |
| JWT | 9.0.2 | Authentication |
| bcrypt | 5.x | Password Hashing |
| Geolib | 3.3.4 | GPS Calculations |
| Helmet | 8.x | Security Headers |
| Compression | 1.x | GZIP Compression |
| Joi | 17.x | Validation |

### AI/ML Models (~35MB total)
| Model | Purpose |
|-------|---------|
| TinyFaceDetector | Fast face detection |
| FaceLandmark68Net | 68-point facial mapping |
| FaceRecognitionNet | 128-dimensional embeddings |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- Webcam & GPS-enabled device

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/yourusername/AttendAI.git
cd AttendAI

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

**Backend** (`backend/.env`):
```env
MONGO_URI=mongodb://localhost:27017/attendai
JWT_SECRET=your_super_secret_key_min_32_characters_long
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

### 3. Seed Demo Data

```bash
cd backend
node scripts/seedData.js
```

### 4. Run Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### 5. Test the App
1. Open http://localhost:5173
2. Login with demo credentials
3. Try marking attendance!

---

## 📁 Project Structure

```
AttendAI/
├── backend/
│   ├── config/
│   │   └── constants.js       # App configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── attendanceController.js
│   │   ├── classController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification
│   │   ├── rateLimiter.js     # Rate limiting
│   │   └── validators.js      # Joi validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Class.js
│   │   ├── Attendance.js
│   │   └── Subject.js
│   ├── routes/
│   ├── scripts/
│   │   └── seedData.js        # Demo data seeder
│   ├── utils/
│   │   └── faceRecognition.js # Face matching utilities
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── models/            # Face-api.js AI models
│   ├── src/
│   │   ├── components/
│   │   │   ├── FaceCapture.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── context/
│   │   │   └── FaceModelContext.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── auth/
│   │   │   ├── student/
│   │   │   ├── teacher/
│   │   │   └── admin/
│   │   ├── services/
│   │   │   └── axios.js
│   │   ├── utils/
│   │   │   ├── pdfExport.js          # Attendance PDF export
│   │   │   └── generateProjectReport.js  # Project report PDF
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
│
├── .gitignore
└── README.md
```

---

## 📊 How It Works

### Attendance Marking Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT MARKS ATTENDANCE                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Select scheduled class from dropdown                     │
│  2. Capture face via webcam                                  │
│  3. System captures GPS coordinates                          │
│  4. Click "Mark Attendance"                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVER-SIDE VALIDATION                          │
├─────────────────────────────────────────────────────────────┤
│  ✓ JWT token valid                                           │
│  ✓ Class exists & not cancelled                              │
│  ✓ Student enrolled in course/semester                       │
│  ✓ Current time within class hours                           │
│  ✓ GPS within 50m of class location                          │
│  ✓ Face matches registered descriptor (distance < 0.6)       │
│  ✓ Not already marked for this class                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ATTENDANCE RECORDED                                         │
│  Status: PRESENT (on time) or LATE (after 10 min)           │
└─────────────────────────────────────────────────────────────┘
```

### Class Scheduling Flow

```
1. Teacher logs in
2. Selects assigned subject
3. Sets date and time
4. System auto-captures teacher's GPS location
5. Class created with location marker
6. Students can mark attendance within 50m radius
```

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register with face descriptor |
| POST | `/login` | Email/password login |
| GET | `/me` | Get current user profile |

### Attendance (`/api/attendance`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mark` | Mark attendance (student) |
| GET | `/pending` | Get pending classes |
| GET | `/student/analytics` | Subject-wise analytics |
| GET | `/class/:id` | Class attendance (teacher) |
| POST | `/update` | Edit attendance (teacher) |
| GET | `/teacher/analytics` | Teacher analytics |
| GET | `/teacher/students` | Student attendance matrix |

### Classes (`/api/classes`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create class (teacher) |
| GET | `/teacher` | Teacher's classes |
| GET | `/student` | Student's available classes |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subjects` | List all subjects |
| POST | `/assign-teacher` | Assign teacher to subject |

---

## 🔒 Security Features

### Authentication
- **bcrypt** password hashing (10 salt rounds)
- **JWT** tokens with 2-hour expiry
- Role-based middleware protection
- **Rate limiting** (100 auth requests / 15 min)

### Anti-Fraud Measures
| Threat | Countermeasure |
|--------|----------------|
| Proxy attendance | Face must match logged-in user |
| Remote marking | GPS within 50m required |
| Duplicate marking | Unique student+class constraint |
| Photo spoofing | Live camera feed required |
| API abuse | Rate limiting + Helmet headers |

### Privacy Protection
- Face processing happens **client-side only**
- Only 128-dimensional descriptors stored (not images)
- Descriptors cannot recreate faces
- HTTPS required in production

---

## 🌐 Deployment

### Recommended Stack (Free Tier)

| Component | Platform | Limits |
|-----------|----------|--------|
| Frontend | Vercel | Unlimited deploys |
| Backend | Render | 750 hrs/month |
| Database | MongoDB Atlas | 512MB free |

### Quick Deploy Steps

#### 1. Database (MongoDB Atlas)
```
1. Create account at mongodb.com/atlas
2. Create free cluster (M0)
3. Add database user
4. Whitelist IP: 0.0.0.0/0
5. Get connection string
```

#### 2. Backend (Render)
```
1. Create account at render.com
2. New Web Service → Connect GitHub
3. Settings:
   - Root Directory: backend
   - Build Command: npm install
   - Start Command: npm start
4. Add environment variables:
   - MONGO_URI=<atlas-connection-string>
   - JWT_SECRET=<random-64-chars>
   - NODE_ENV=production
   - FRONTEND_URL=<vercel-url>
```

#### 3. Frontend (Vercel)
```
1. Create account at vercel.com
2. Import GitHub repository
3. Settings:
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: dist
4. Add environment variable:
   - VITE_API_URL=<render-backend-url>
```

### Production Checklist
- [ ] Strong JWT_SECRET (64+ characters)
- [ ] MongoDB Atlas IP whitelist
- [ ] CORS configured with frontend URL
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Rate limiting active

---

## 📸 Screenshots

### Landing Page
- Futuristic dark theme with animated particles
- Floating orbs and grid background
- Smooth scroll animations

### Student Dashboard
- Pending classes list
- Quick attendance marking
- Subject-wise analytics with doughnut charts

### Teacher Dashboard
- Class scheduling with GPS capture
- Attendance management
- Monthly analytics view

### Mark Attendance
- Live camera feed
- Face detection guide
- GPS status indicator

---

## 📄 Project Report

Generate a comprehensive PDF project report directly from the app!

### How to Download:
1. Go to the Landing Page
2. Scroll to the footer
3. Click **"Download Project Report"**
4. A 14-page PDF will be generated with:
   - Cover page
   - Table of contents
   - Abstract & Introduction
   - System architecture
   - Tech stack details
   - Database design
   - Security features
   - Testing results
   - And more!

---

## 🐛 Troubleshooting

### Camera Not Working
- Check browser permissions
- Use HTTPS in production
- Try Chrome (recommended)

### GPS Inaccurate
- Enable high accuracy mode
- Move near window/outdoors
- Wait for GPS stabilization

### Face Not Recognized
- Ensure good lighting
- Face camera directly
- Re-register face if needed

### "Class Not Active"
- Check class schedule
- Verify date is today
- Server time is used

### CORS Error
- Add frontend URL to backend FRONTEND_URL env
- Redeploy backend

---

## 🚀 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Multiple face descriptors per user
- [ ] Email/push notifications
- [ ] Leave request system
- [ ] Bulk class scheduling
- [ ] Liveness detection (anti-spoofing)
- [ ] Multi-institution support
- [ ] LMS integration

---

## 📝 License

This project is for educational purposes.

---

## 🙏 Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) - Face recognition
- [TensorFlow.js](https://www.tensorflow.org/js) - ML in browser
- [MongoDB](https://www.mongodb.com/) - Database
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations

---

## ⭐ Feature Highlights

| Feature | Benefit |
|---------|---------|
| 🤖 AI Face Recognition | Eliminates proxy attendance |
| 📍 GPS Verification | Ensures physical presence |
| ⏰ Late Detection | Auto-tracks punctuality |
| 📊 Real-time Analytics | Instant insights |
| 📄 PDF Export | Easy record-keeping |
| 🎨 Modern UI | Beautiful, responsive design |
| 🔐 Multi-layer Security | Fraud-proof system |
| ⚡ Optimized Performance | Fast face matching |

---

<div align="center">

**Built with ❤️ for modern education management**

[⬆ Back to Top](#-attendai---ai-powered-smart-attendance-system)

</div>
