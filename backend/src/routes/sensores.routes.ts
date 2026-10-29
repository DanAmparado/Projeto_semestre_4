import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../middlewares/auth';
import { autorizarFuncionario } from '../middlewares/autorizarFuncionario';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate';
import { leiturasParamsSchema, listarLeiturasQuerySchema } from '../schemas/sensores.schema';
import {
  atualizarSensorBodySchema,
  criarSensorBodySchema,
  sensorIdParamSchema,
} from '../schemas/sensoresAdmin.schema';
import { hemocentroIdParamSchema } from '../schemas/estoque.schema';
import { listarLeiturasAmbiente } from '../services/sensores.service';
import {
  atualizarSensor,
  criarSensor,
  listarSensores,
} from '../services/sensoresAdmin.service';

const router = Router();

router.get(
  '/:id/sensores',
  auth,
  validateParams(hemocentroIdParamSchema),
  autorizarFuncionario,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sensores = await listarSensores(req.params.id);
      res.json(sensores);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/sensores',
  auth,
  validateParams(hemocentroIdParamSchema),
  autorizarFuncionario,
  validateBody(criarSensorBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sensor = await criarSensor(req.params.id, req.body);
      res.status(201).json(sensor);
    } catch (err) {
      next(err);
    }
  }
);

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

export const sensoresPatchRouter = Router();

sensoresPatchRouter.patch(
  '/:id',
  auth,
  validateParams(sensorIdParamSchema),
  validateBody(atualizarSensorBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await atualizarSensor(req.params.id, req.user!.id, req.body);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);