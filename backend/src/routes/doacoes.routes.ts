import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../middlewares/auth';
import { autorizarFuncionario } from '../middlewares/autorizarFuncionario';
import { validateBody, validateParams } from '../middlewares/validate';
import { registrarDoacaoBodySchema, registrarDoacaoParamsSchema } from '../schemas/doacoes.schema';
import { registrarDoacao } from '../services/doacoes.service';

const router = Router();

router.post(
  '/:id/doacoes',
  auth,
  validateParams(registrarDoacaoParamsSchema),
  autorizarFuncionario,
  validateBody(registrarDoacaoBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hemocentroId = req.params.id;
      const funcionarioId = req.user!.id;

      const resultado = await registrarDoacao(hemocentroId, funcionarioId, req.body);
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

export default router;