# Environment Variables Setup

File ini menjelaskan environment variables yang digunakan di backend.

## Setup

1. Buat file `.env` di root folder `backend` dengan isi berikut:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DATABASE_URL="mysql://user:password@localhost:3306/database_name"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
IMPERSONATE_TOKEN_EXPIRES_IN=24h

# CORS Configuration (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=10

# Seeder Configuration (for development)
SEEDER_ADMIN_EMAIL=admin@rusunawa.com
SEEDER_ADMIN_PASSWORD=admin123
SEEDER_ADMIN_USERNAME=superadmin
```

## Environment Variables

### Server Configuration

#### `PORT`
- **Deskripsi**: Port untuk menjalankan server
- **Default**: `8000`
- **Contoh**: `8000` atau `3000`

#### `NODE_ENV`
- **Deskripsi**: Environment mode (development, production, test)
- **Default**: `development`
- **Contoh**: `development`, `production`, `test`

### Database Configuration

#### `DATABASE_URL`
- **Deskripsi**: Connection string untuk database
- **Required**: Yes
- **Contoh**: `mysql://user:password@localhost:3306/database_name`

### JWT Configuration

#### `JWT_SECRET`
- **Deskripsi**: Secret key untuk signing JWT tokens
- **Required**: Yes
- **Catatan**: Harus diubah di production dengan nilai yang kuat dan aman

#### `JWT_EXPIRES_IN`
- **Deskripsi**: Waktu kedaluwarsa untuk access token
- **Default**: `15m` (15 menit)
- **Contoh**: `15m`, `1h`, `24h`, `7d`

#### `REFRESH_TOKEN_EXPIRES_IN`
- **Deskripsi**: Waktu kedaluwarsa untuk refresh token
- **Default**: `7d` (7 hari)
- **Contoh**: `7d`, `30d`, `90d`

#### `IMPERSONATE_TOKEN_EXPIRES_IN`
- **Deskripsi**: Waktu kedaluwarsa untuk impersonate token
- **Default**: `24h` (24 jam)
- **Contoh**: `1h`, `24h`, `48h`

### CORS Configuration

#### `CORS_ORIGINS`
- **Deskripsi**: Daftar origin yang diizinkan untuk CORS (dipisahkan dengan koma)
- **Default**: `http://localhost:3000,http://localhost:5173,http://localhost:5174`
- **Contoh**: `http://localhost:3000,http://localhost:5173,https://app.example.com`

### Bcrypt Configuration

#### `BCRYPT_SALT_ROUNDS`
- **Deskripsi**: Jumlah rounds untuk bcrypt hashing (semakin tinggi semakin aman tapi lebih lambat)
- **Default**: `10`
- **Rekomendasi**: `10-12` untuk production

### Seeder Configuration

#### `SEEDER_ADMIN_EMAIL`
- **Deskripsi**: Email untuk superadmin yang dibuat oleh seeder
- **Default**: `admin@rusunawa.com`
- **Catatan**: Hanya digunakan saat menjalankan seeder

#### `SEEDER_ADMIN_PASSWORD`
- **Deskripsi**: Password untuk superadmin yang dibuat oleh seeder
- **Default**: `admin123`
- **Catatan**: Hanya digunakan saat menjalankan seeder, pastikan diubah setelah seeder dijalankan

#### `SEEDER_ADMIN_USERNAME`
- **Deskripsi**: Username untuk superadmin yang dibuat oleh seeder
- **Default**: `superadmin`
- **Catatan**: Hanya digunakan saat menjalankan seeder

## Catatan Penting

- File `.env` sudah ada di `.gitignore` dan tidak akan di-commit ke repository
- Untuk production, pastikan untuk:
  - Mengubah `JWT_SECRET` dengan nilai yang kuat dan unik
  - Mengubah `DATABASE_URL` sesuai dengan database production
  - Mengatur `CORS_ORIGINS` sesuai dengan domain production
  - Mengubah `NODE_ENV` menjadi `production`
  - Mengubah credentials seeder atau menghapusnya jika tidak diperlukan
- Jangan commit file `.env` yang berisi credentials production ke repository

