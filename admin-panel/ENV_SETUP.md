# Environment Variables Setup

File ini menjelaskan environment variables yang digunakan di admin panel.

## Setup

1. Buat file `.env` di root folder `admin-panel` dengan isi berikut:

```env
# API Configuration
VITE_API_URL=http://localhost:8000/api

# Development Auto-fill Credentials (only used in development mode)
VITE_DEV_ADMIN_EMAIL=admin@rusunawa.com
VITE_DEV_ADMIN_PASSWORD=admin123
```

## Environment Variables

### `VITE_API_URL`
- **Deskripsi**: URL base untuk API backend
- **Default**: `http://localhost:8000/api`
- **Contoh**: `http://localhost:8000/api` atau `https://api.rusunawa.com/api`

### `VITE_DEV_ADMIN_EMAIL`
- **Deskripsi**: Email untuk auto-fill di form login (hanya di development mode)
- **Default**: `admin@rusunawa.com`
- **Catatan**: Hanya digunakan saat `NODE_ENV=development`

### `VITE_DEV_ADMIN_PASSWORD`
- **Deskripsi**: Password untuk auto-fill di form login (hanya di development mode)
- **Default**: `admin123`
- **Catatan**: Hanya digunakan saat `NODE_ENV=development`

## Catatan Penting

- File `.env` sudah ada di `.gitignore` dan tidak akan di-commit ke repository
- Untuk production, pastikan untuk mengubah nilai-nilai ini sesuai dengan environment production
- Jangan commit file `.env` yang berisi credentials production ke repository

