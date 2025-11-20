import { Router } from 'express';
import { closeFiscalYear, getFiscalYears, getFiscalMonths } from '../controllers/fiscalController';

const router = Router();

router.post('/close', closeFiscalYear);
router.get('/years', getFiscalYears);
router.get('/months', getFiscalMonths);

export default router;
