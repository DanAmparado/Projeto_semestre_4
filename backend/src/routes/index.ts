import { Router } from 'express';
import healthRoutes from './health.routes';
import iotRoutes from './iot.routes';
import sensoresRoutes from './sensores.routes';
import doadoresRoutes from './doadores.routes';
import doacoesRoutes from './doacoes.routes';
import meRoutes from './me.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/iot', iotRoutes);
router.use('/hemocentros', sensoresRoutes);
router.use('/hemocentros', doadoresRoutes);
router.use('/hemocentros', doacoesRoutes);
router.use('/me', meRoutes);

export default router;