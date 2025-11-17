# Panduan Integrasi Frontend - Backend

## 🎉 Status Integrasi
✅ Semua halaman sudah diintegrasikan dengan React Query!

## 📁 Struktur Project
```
Program Akuntansi V8/
├── src/                          # Frontend (React + TypeScript)
│   ├── api/
│   │   └── axiosInstance.ts      # Axios instance dengan interceptors
│   ├── services/
│   │   └── api.ts                # Alternative API configuration
│   ├── pages/
│   │   ├── Dashboard.tsx         # ✅ Connected to GET /api/laporan
│   │   ├── Transaksi.tsx         # ✅ Connected to CRUD /api/transaksi
│   │   ├── Auth/
│   │   │   ├── Login.tsx         # ✅ Connected to POST /api/auth/login
│   │   │   └── Register.tsx      # ✅ Connected to POST /api/auth/register
│   │   └── MasterData/
│   │       ├── Kategori.tsx      # ✅ Connected to CRUD /api/master/kategori
│   │       ├── SubKategori.tsx   # ✅ Connected to CRUD /api/master/subkategori
│   │       └── Akun.tsx          # ✅ Connected to CRUD /api/master/akun
│   └── ...
└── akunting-backend/             # Backend (Express + TypeScript + MongoDB)
    ├── src/
    │   ├── server.ts
    │   ├── routes/
    │   ├── controllers/
    │   └── models/
    └── package.json
```

## 🔗 API Endpoints yang Sudah Diintegrasikan

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user baru

### Master Data
- `GET /api/master/kategori` - Fetch semua kategori
- `POST /api/master/kategori` - Tambah kategori baru
- `PUT /api/master/kategori/:id` - Update kategori
- `DELETE /api/master/kategori/:id` - Hapus kategori

- `GET /api/master/subkategori` - Fetch semua sub kategori
- `POST /api/master/subkategori` - Tambah sub kategori baru
- `PUT /api/master/subkategori/:id` - Update sub kategori
- `DELETE /api/master/subkategori/:id` - Hapus sub kategori

- `GET /api/master/akun` - Fetch semua akun
- `POST /api/master/akun` - Tambah akun baru
- `PUT /api/master/akun/:id` - Update akun
- `DELETE /api/master/akun/:id` - Hapus akun

### Transaksi
- `GET /api/transaksi` - Fetch semua transaksi
- `POST /api/transaksi` - Tambah transaksi baru

### Laporan
- `GET /api/laporan/rekap-aggregate?tahun=2025` - Dashboard data

## 🚀 Cara Menjalankan Project

### 1. Setup Backend
```powershell
# Masuk ke folder backend
cd "akunting-backend"

# Install dependencies (jika belum)
npm install

# Pastikan MongoDB sudah berjalan di localhost:27017
# Atau update MONGODB_URI di file .env

# Jalankan backend development server
npm run dev
```

Backend akan berjalan di: **http://localhost:5000**

### 2. Setup Frontend
```powershell
# Buka terminal baru, masuk ke folder root project
cd "d:\Robi\RnD\Project - Program Akuntansi\Program Akuntansi V8"

# Install dependencies (jika belum)
npm install

# Jalankan frontend development server
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173** (atau port lain yang ditampilkan Vite)

### 3. Jalankan Keduanya Bersamaan (Optional)
Untuk menjalankan backend dan frontend bersamaan, install concurrently di root project:

```powershell
# Install concurrently
npm install --save-dev concurrently

# Update package.json scripts
# Tambahkan script berikut:
# "dev:all": "concurrently \"npm --prefix akunting-backend run dev\" \"npm run dev\""

# Jalankan keduanya
npm run dev:all
```

## 🔑 Login Credentials (Demo Mode)
Jika backend belum berjalan, frontend akan menggunakan dummy auth:

- **Email:** admin@akunting.com
- **Password:** admin123

atau

- **Email:** user@akunting.com
- **Password:** user123

## 📦 React Query Benefits

Semua halaman sekarang menggunakan **React Query** untuk:

1. **Automatic Caching** - Data di-cache otomatis
2. **Background Refetching** - Data ter-update otomatis
3. **Optimistic Updates** - UI update cepat
4. **Error Handling** - Error handling yang konsisten
5. **Loading States** - Loading state management otomatis
6. **Query Invalidation** - Cache invalidation setelah mutation

### Contoh Penggunaan:

#### Fetch Data
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['kategori'],
  queryFn: async () => {
    const response = await axiosInstance.get('/master/kategori');
    return response.data;
  },
});
```

#### Create/Update Data
```typescript
const saveMutation = useMutation({
  mutationFn: async (payload) => {
    return axiosInstance.post('/master/kategori', payload);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['kategori'] });
    toast.success('Data berhasil disimpan!');
  },
});

// Gunakan dengan:
saveMutation.mutate(formData);
```

## 🛠️ Troubleshooting

### Backend tidak bisa connect ke MongoDB
```powershell
# Pastikan MongoDB berjalan
# Atau update .env file dengan MongoDB URI yang benar
```

### CORS Error
Backend sudah dikonfigurasi dengan CORS. Pastikan backend berjalan di port 5000.

### Port sudah digunakan
Jika port 5000 atau 5173 sudah digunakan:
- Backend: Update PORT di `.env`
- Frontend: Vite akan otomatis cari port lain atau update di `vite.config.ts`

## 📝 Next Steps

1. ✅ Pastikan backend sudah berjalan
2. ✅ Test semua fitur CRUD
3. ✅ Verifikasi authentication flow
4. ✅ Test dashboard dengan data real
5. ⏳ Deploy ke production (jika diperlukan)

## 💡 Tips

- Gunakan **React Query DevTools** untuk debugging queries
- Check **Network tab** di browser untuk melihat API calls
- Gunakan **React DevTools** untuk inspect component state
- Backend logs akan tampil di terminal backend

---

**Happy Coding! 🎉**
