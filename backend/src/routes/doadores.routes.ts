import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../middlewares/auth';
import { autorizarFuncionario } from '../middlewares/autorizarFuncionario';
import { validateParams, validateQuery } from '../middlewares/validate';
import { buscarDoadorParamsSchema, buscarDoadorQuerySchema } from '../schemas/doadores.schema';
import { buscarDoadorPorCpf } from '../services/doadores.service';

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

export default router;