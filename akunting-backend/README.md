# akunting-backend

TypeScript + Express backend scaffold for accounting app (no dummy data).

## Quick start

1. Copy `.env.example` to `.env` and adjust values:
```
PORT=8080
MONGO_URI=mongodb://localhost:27017/akuntingdb
JWT_SECRET=your_secret_here
```

2. Install dependencies:
```bash
npm install
```

3. Run in development (auto restart):
```bash
npm run dev
```

API routes (basic):
- `POST /api/auth/register` — register user (username + password)
- `POST /api/auth/login` — login => returns JWT
- `GET/POST/PUT/DELETE /api/master/kategori`
- `GET/POST/PUT/DELETE /api/master/subkategori`
- `GET/POST/PUT/DELETE /api/master/akun`
- `GET/POST/PUT/DELETE /api/transaksi`
- `GET /api/dashboard/rekap?tahun=2025` — rekap per year fiscal (Dec–Nov)

This scaffold focuses on functionality and types; adapt models/controllers to your needs.
