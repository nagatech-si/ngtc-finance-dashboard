import { Router } from 'express';
import {
  listKategori, createKategori, updateKategori, deleteKategori,
  listSubKategori, createSubKategori, updateSubKategori, deleteSubKategori,
  listAkun, createAkun, updateAkun, deleteAkun
} from '../controllers/masterController';
import { authenticate } from '../middleware/authMiddleware';
const router = Router();

// Kategori routes
router.get('/kategori', listKategori);
// Protected write routes (require authentication)
router.post('/kategori', authenticate, createKategori);
router.delete('/kategori/:id', authenticate, deleteKategori);
router.put('/kategori/:id', authenticate, updateKategori);

// SubKategori routes
router.get('/subkategori', listSubKategori);
router.get('/subkategori', listSubKategori);
router.post('/subkategori', authenticate, createSubKategori);
router.put('/subkategori/:id', authenticate, updateSubKategori);
router.delete('/subkategori/:id', authenticate, deleteSubKategori);

// Akun routes
router.get('/akun', listAkun);
router.post('/akun', authenticate, createAkun);
router.put('/akun/:id', authenticate, updateAkun);
router.delete('/akun/:id', authenticate, deleteAkun);

export default router;
