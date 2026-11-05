import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../middlewares/auth';
import { autorizarFuncionario } from '../middlewares/autorizarFuncionario';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate';
import {
  alertaIdParamSchema,
  criarMovimentacaoBodySchema,
  hemocentroIdParamSchema,
  listarAlertasQuerySchema,
  listarMovimentacoesQuerySchema,
} from '../schemas/estoque.schema';
import {
  criarMovimentacao,
  getEstoqueInterno,
  listarAlertas,
  listarMovimentacoes,
  resolverAlerta,
} from '../services/estoque.service';

const router = Router();

router.get(
  '/:id/estoque',
  auth,
  validateParams(hemocentroIdParamSchema),
  autorizarFuncionario,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const estoque = await getEstoqueInterno(req.params.id);
      res.json(estoque);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id/alertas',
  auth,
  validateParams(hemocentroIdParamSchema),
  autorizarFuncionario,
  validateQuery(listarAlertasQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resolvido } = (req as any).validatedQuery;
      const alertas = await listarAlertas(req.params.id, resolvido);
      res.json(alertas);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id/movimentacoes',
  auth,
  validateParams(hemocentroIdParamSchema),
  autorizarFuncionario,
  validateQuery(listarMovimentacoesQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filtros = (req as any).validatedQuery;
      const movs = await listarMovimentacoes(req.params.id, filtros);
      res.json(movs);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/movimentacoes',
  auth,
  validateParams(hemocentroIdParamSchema),
  autorizarFuncionario,
  validateBody(criarMovimentacaoBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mov = await criarMovimentacao(req.params.id, req.user!.id, req.body);
      res.status(201).json(mov);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

export const alertasRouter = Router();

alertasRouter.patch(
  '/:id/resolver',
  auth,
  validateParams(alertaIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await resolverAlerta(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);