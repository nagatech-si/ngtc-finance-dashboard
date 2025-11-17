import { Router } from 'express';
import {
  listKategori, createKategori,
  listSubKategori, createSubKategori, updateSubKategori, deleteSubKategori,
  listAkun, createAkun, updateAkun, deleteAkun
} from '../controllers/masterController';
const router = Router();

// Kategori routes
router.get('/kategori', listKategori);
router.post('/kategori', createKategori);
// updateKategori dan deleteKategori tidak ada, hapus route

// SubKategori routes
router.get('/subkategori', listSubKategori);
router.post('/subkategori', createSubKategori);
router.put('/subkategori/:id', updateSubKategori);
router.delete('/subkategori/:id', deleteSubKategori);

// Akun routes
router.get('/akun', listAkun);
router.post('/akun', createAkun);
router.put('/akun/:id', updateAkun);
router.delete('/akun/:id', deleteAkun);

export default router;
