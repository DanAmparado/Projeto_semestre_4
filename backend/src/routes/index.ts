import { Router } from 'express';
import healthRoutes from './health.routes';
import iotRoutes from './iot.routes';
import sensoresRoutes from './sensores.routes';
import doadoresRoutes from './doadores.routes';
import doacoesRoutes from './doacoes.routes';
import meRoutes from './me.routes';
import publicoRoutes from './publico.routes';
import relatoriosRoutes from './relatorios.routes';
import estoqueRoutes, { alertasRouter } from './estoque.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/iot', iotRoutes);
router.use('/hemocentros', sensoresRoutes);
router.use('/hemocentros', doadoresRoutes);
router.use('/hemocentros', doacoesRoutes);
router.use('/hemocentros', relatoriosRoutes);
router.use('/hemocentros', estoqueRoutes);
router.use('/alertas', alertasRouter);
router.use('/me', meRoutes);
router.use('/publico', publicoRoutes);

export default router;