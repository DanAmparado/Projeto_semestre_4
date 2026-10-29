import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../middlewares/auth';
import { autorizarFuncionario } from '../middlewares/autorizarFuncionario';
import { validateParams } from '../middlewares/validate';
import { hemocentroIdParamSchema } from '../schemas/estoque.schema';
import { resumoDashboard } from '../services/dashboard.service';

const router = Router();

router.get(
  '/:id/dashboard/resumo',
  auth,
  validateParams(hemocentroIdParamSchema),
  autorizarFuncionario,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resumo = await resumoDashboard(req.params.id);
      res.json(resumo);
    } catch (err) {
      next(err);
    }
  }
);

export default router;