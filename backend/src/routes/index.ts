import { Router } from 'express';
import healthRoutes from './health.routes';

const router = Router();

router.use('/health', healthRoutes);

// Rotas a adicionar nas próximas etapas:
// router.use('/me', meRoutes);
// router.use('/publico', publicoRoutes);
// router.use('/hemocentros', estoqueRoutes);
// router.use('/iot', iotRoutes);
// router.use('/alertas', alertasRoutes);
// router.use('/sensores', sensoresRoutes);

export default router;