import { NextFunction, Request, Response, Router } from 'express';
import { validateParams, validateQuery } from '../middlewares/validate';
import {
  estoqueAgregadoQuerySchema,
  hemocentroIdParamSchema,
  listarHemocentrosQuerySchema,
} from '../schemas/publico.schema';
import {
  getEstoqueHemocentro,
  listarEstoqueAgregado,
  listarHemocentros,
} from '../services/publico.service';

const router = Router();

router.get(
  '/hemocentros',
  validateQuery(listarHemocentrosQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filtros = (req as any).validatedQuery;
      const lista = await listarHemocentros(filtros);
      res.json(lista);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/hemocentros/:id/estoque',
  validateParams(hemocentroIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const estoque = await getEstoqueHemocentro(req.params.id);
      res.json(estoque);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/estoque',
  validateQuery(estoqueAgregadoQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filtros = (req as any).validatedQuery;
      const resultado = await listarEstoqueAgregado(filtros);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

export default router;