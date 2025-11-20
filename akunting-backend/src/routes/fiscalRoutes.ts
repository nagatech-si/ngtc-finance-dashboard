import { Router } from 'express';
import { closeFiscalYear, getFiscalYears, getFiscalMonths, getActiveFiscalYear } from '../controllers/fiscalController';

const router = Router();

router.post('/close', closeFiscalYear);
router.get('/years', getFiscalYears);
router.get('/months', getFiscalMonths);
router.get('/active', getActiveFiscalYear);

export default router;
