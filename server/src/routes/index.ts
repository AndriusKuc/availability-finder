import { Router } from 'express';
import surveyRoutes from './surveys';
import adminRoutes from './admin';

const router = Router();

router.use('/surveys', surveyRoutes);
router.use('/admin', adminRoutes);

export default router;
