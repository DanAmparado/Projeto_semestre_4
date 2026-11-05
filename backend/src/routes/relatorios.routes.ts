import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../middlewares/auth';
import { autorizarFuncionario } from '../middlewares/autorizarFuncionario';
import { validateParams, validateQuery } from '../middlewares/validate';
import {
  cepQuerySchema,
  periodoQuerySchema,
  previsaoQuerySchema,
  relatorioParamsSchema,
} from '../schemas/relatorios.schema';
import {
  controleEstatistico,
  estudoDoadores,
  mediaDoacoes,
  previsaoDemanda,
} from '../services/relatorios.service';

const router = Router();

router.get(
  '/:id/relatorios/previsao',
  auth,
  validateParams(relatorioParamsSchema),
  autorizarFuncionario,
  validateQuery(previsaoQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tipo_sanguineo, semanas, horizonte } = (req as any).validatedQuery;
      const data = await previsaoDemanda(req.params.id, tipo_sanguineo, semanas, horizonte);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id/relatorios/media-doacoes',
  auth,
  validateParams(relatorioParamsSchema),
  autorizarFuncionario,
  validateQuery(periodoQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inicio, fim } = (req as any).validatedQuery;
      const data = await mediaDoacoes(req.params.id, inicio, fim);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id/relatorios/estudo-doadores',
  auth,
  validateParams(relatorioParamsSchema),
  autorizarFuncionario,
  validateQuery(periodoQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inicio, fim } = (req as any).validatedQuery;
      const data = await estudoDoadores(req.params.id, inicio, fim);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id/relatorios/cep',
  auth,
  validateParams(relatorioParamsSchema),
  autorizarFuncionario,
  validateQuery(cepQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sensor_id, inicio, fim } = (req as any).validatedQuery;
      const data = await controleEstatistico(req.params.id, sensor_id, inicio, fim);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

export default router;