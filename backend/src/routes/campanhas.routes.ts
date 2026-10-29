import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../middlewares/auth';
import { autorizarFuncionario } from '../middlewares/autorizarFuncionario';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate';
import { hemocentroIdParamSchema } from '../schemas/estoque.schema';
import {
  criarCampanhaBodySchema,
  listarNotificacoesAdminQuerySchema,
} from '../schemas/campanhas.schema';
import { criarCampanha, listarNotificacoesAdmin } from '../services/campanhas.service';

const router = Router();

router.post(
  '/:id/campanhas',
  auth,
  validateParams(hemocentroIdParamSchema),
  autorizarFuncionario,
  validateBody(criarCampanhaBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resultado = await criarCampanha(req.params.id, req.body);
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id/notificacoes',
  auth,
  validateParams(hemocentroIdParamSchema),
  autorizarFuncionario,
  validateQuery(listarNotificacoesAdminQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit } = (req as any).validatedQuery;
      const notificacoes = await listarNotificacoesAdmin(req.params.id, limit);
      res.json(notificacoes);
    } catch (err) {
      next(err);
    }
  }
);

export default router;