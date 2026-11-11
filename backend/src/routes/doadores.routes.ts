import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../middlewares/auth';
import { autorizarFuncionario } from '../middlewares/autorizarFuncionario';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate';
import { buscarDoadorParamsSchema, buscarDoadorQuerySchema, criarDoadorBodySchema } from '../schemas/doadores.schema';
import { buscarDoadorPorCpf, criarDoadorPeloFuncionario  } from '../services/doadores.service';

const router = Router();

router.get(
  '/:id/doadores',
  auth,
  validateParams(buscarDoadorParamsSchema),
  autorizarFuncionario,
  validateQuery(buscarDoadorQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cpf } = (req as any).validatedQuery;
      const doador = await buscarDoadorPorCpf(cpf);
      res.json(doador);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/doadores',
  auth,
  validateParams(buscarDoadorParamsSchema),
  autorizarFuncionario,
  validateBody(criarDoadorBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resultado = await criarDoadorPeloFuncionario(req.body);
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

export default router;