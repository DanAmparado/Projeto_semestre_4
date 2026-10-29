import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../middlewares/auth';
import { validateBody, validateParams } from '../middlewares/validate';
import { atualizarPerfilBodySchema, notificacaoIdParamSchema } from '../schemas/me.schema';
import {
  atualizarPerfil,
  getPerfil,
  listarDoacoes,
  listarNotificacoes,
  marcarNotificacaoLida,
} from '../services/me.service';

const router = Router();

router.use(auth);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const perfil = await getPerfil(req.user!.id, req.user!.email);
    res.json(perfil);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/',
  validateBody(atualizarPerfilBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await atualizarPerfil(req.user!.id, req.body);
      const perfil = await getPerfil(req.user!.id, req.user!.email);
      res.json(perfil);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/doacoes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doacoes = await listarDoacoes(req.user!.id);
    res.json(doacoes);
  } catch (err) {
    next(err);
  }
});

router.get('/notificacoes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificacoes = await listarNotificacoes(req.user!.id);
    res.json(notificacoes);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/notificacoes/:id/lida',
  validateParams(notificacaoIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await marcarNotificacaoLida(req.user!.id, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;