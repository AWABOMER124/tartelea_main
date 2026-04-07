# Tartelea Platform - Technical Documentation v1.0

## 1. Project Overview
Tartelea is a premium EdTech platform designed for Islamic education and community interaction. It consists of a high-performance Node.js backend and a modern Flutter mobile application, integrated with real-time audio rooms and a structured learning system.

---

## 2. Technology Stack

### Backend (Node.js)
- **Framework**: Express.js (Modular Architecture).
- **Language**: JavaScript (ES6+).
- **Database**: PostgreSQL (Structured Relational Data).
- **Real-time**: LiveKit (WebRTC Audio Rooms integration).
- **Security**: 
  - JWT (JSON Web Tokens) for session management.
  - Helmet.js for HTTP header security.
  - Express Rate Limit for DDoS prevention.
  - Bcrypt.js for password hashing.
  - Zod for strict request validation.
- **Mailing**: Nodemailer (SMTP based OTP delivery).

### Mobile App (Flutter)
- **State Management**: Riverpod (Reactive Architecture).
- **Navigation**: GoRouter (Declarative routing).
- **UI Architecture**: Feature-First Clean Architecture.
- **Storage**: SharedPreferences (Encrypted/Persistent storage for tokens).
- **Networking**: Dio (Custom Interceptor for Auth & Error Handling).

---

## 3. Core Modules & Architecture

### A. Authentication System (Professional Grade)
The system supports three major flows:
1. **Email/Password**: Includes a 6-digit OTP verification via real SMTP (`perfect-team.cloud`).
2. **Google Social Auth**: Full integration with Firebase/Google OAuth2, returning a standardized user profile and JWT.
3. **Password Recovery**: Secure token-based reset flow (`reset_token` with expiry).

**User Roles (RBAC):**
- `student`: Access to courses and content.
- `trainer`: Ability to manage audio rooms and workshops.
- `admin`: Full system control via dashboard.

### B. Database Schema Structure
- **Users**: Core credentials and verification status.
- **Profiles**: Extended user details (Full bio, country, social links).
- **User_Roles**: Granular RBAC linking many-to-many.
- **Posts & Contents**: Organized by categories for the community feed.

---

## 4. Security & Performance Implementations

### Backend Security
1. **Request Validation**: All endpoints are protected by Zod schemas to prevent SQL injection or malformed data.
2. **Error Handling**: Standardized JSON responses with a unified `message` field for mobile compatibility.
3. **SMTP Timeout**: Implemented `Promise.race` for mail delivery to prevent server hanging if SMTP is slow.

### Mobile App Resilience
1. **Reactive Provider Router**: The app uses a `routerProvider` that listens to auth state changes. Any change in the JWT token (Login/Logout) triggers an immediate, atomic UI redirection.
2. **Intelligent Error Parsing**: A custom `ApiClient` interceptor that "dives" into backend responses to extract human-readable Arabic error messages.

---

## 5. Deployment & Infrastructure
The project is fully containerized using **Docker**:
- `backend`: Node.js container with auto-build dependencies.
- `db`: PostgreSQL container with environment-persistent volumes.
- `proxy`: Managed via Traefik for SSL termination and routing.

---

## 6. How to Run (Development)

### Backend:
```bash
docker compose up --build -d
```

### Mobile:
```bash
flutter pub get
flutter run
```

---

## 7. Developer Notes for Reviewer
- **State Management**: The app strictly follows the "State Notifier" pattern in Riverpod.
- **API Client**: Located in `lib/core/api/api_client.dart`, handles all 401 (Unauthorized) cases by clearing local storage.
- **Database Migrations**: Initial schema is provided in `backend/src/db/schema.sql`.

---
*Last Updated: 2026-04-08*
