# Backend API - Rusunawa App

Backend API untuk aplikasi Rusunawa menggunakan Express.js, TypeScript, dan Prisma ORM.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env` di root folder backend dengan isi:

```env
PORT=8000
NODE_ENV=development

DATABASE_URL="mysql://user:password@localhost:3306/database_name"

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Start Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:8000`

## API Endpoints

### Authentication

#### Register
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "firstname": "John",
    "lastname": "Doe"
  }
  ```

#### Login
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Get Current User
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`

## Project Structure

```
backend/
├── src/
│   ├── config/          # Konfigurasi (database, dll)
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Custom middlewares
│   ├── routes/          # Route definitions
│   └── utils/           # Utility functions
├── prisma/              # Prisma schema dan migrations
└── index.ts             # Entry point
```

## Features

- ✅ JWT Authentication
- ✅ Password Hashing dengan bcrypt
- ✅ Input Validation
- ✅ Error Handling
- ✅ TypeScript Support
- ✅ Prisma ORM

