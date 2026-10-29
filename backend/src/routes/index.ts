import { Router } from 'express';
import healthRoutes from './health.routes';
import iotRoutes from './iot.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/iot', iotRoutes);

// Próximas etapas:
// router.use('/me', meRoutes);
// router.use('/publico', publicoRoutes);
// router.use('/hemocentros', estoqueRoutes);
// router.use('/alertas', alertasRoutes);

export default router;