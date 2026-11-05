import { NextFunction, Request, Response, Router } from 'express';
import { validateBody } from '../middlewares/validate';
import { iotKey } from '../middlewares/iotKey';
import { AmbienteInput, BalancaInput, ambienteSchema, balancaSchema } from '../schemas/iot.schema';
import { registrarLeituraAmbiente, registrarLeituraBalanca } from '../services/iot.service';

const router = Router();

// Todas as rotas /iot exigem x-iot-key
router.use(iotKey);

router.post(
  '/ambiente',
  validateBody(ambienteSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await registrarLeituraAmbiente(req.body as AmbienteInput);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/balanca',
  validateBody(balancaSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await registrarLeituraBalanca(req.body as BalancaInput);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;