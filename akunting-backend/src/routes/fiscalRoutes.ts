import { Router } from 'express';
import { closeFiscalYear } from '../controllers/fiscalController';

const router = Router();

router.post('/close', closeFiscalYear);

export default router;
