import { Router } from 'express';
import { createTransaksi, listTransaksi, updateTransaksi, deleteTransaksi, editTransaksiBulanan, deleteTransaksiBulanan } from '../controllers/transaksiController';
const router = Router();

router.post('/', createTransaksi);
router.get('/', listTransaksi);
router.put('/:id', updateTransaksi);
router.delete('/:id', deleteTransaksi);

// Edit nilai data bulanan
router.put('/:id/bulan/:bulan', editTransaksiBulanan);
// Hapus data bulanan
router.delete('/:id/bulan/:bulan', deleteTransaksiBulanan);

export default router;
