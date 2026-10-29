import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../middlewares/auth';
import { autorizarFuncionario } from '../middlewares/autorizarFuncionario';
import { validateParams, validateQuery } from '../middlewares/validate';
import { leiturasParamsSchema, listarLeiturasQuerySchema } from '../schemas/sensores.schema';
import { listarLeiturasAmbiente } from '../services/sensores.service';

const router = Router();

router.get(
  '/:id/sensores/:sensorId/leituras',
  auth,
  validateParams(leiturasParamsSchema),
  autorizarFuncionario,
  validateQuery(listarLeiturasQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hemocentroId = req.params.id;
      const sensorId = req.params.sensorId;
      const limit = (req as any).validatedQuery.limit as number;

      const leituras = await listarLeiturasAmbiente(hemocentroId, sensorId, limit);
      res.json(leituras);
    } catch (err) {
      next(err);
    }
  }
);

export default router;