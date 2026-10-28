import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

/**
 * Valida o corpo da requisição com um schema Zod.
 * Em caso de erro, responde 400 com o formato padronizado.
 * Em caso de sucesso, substitui req.body pelo valor tipado e parseado.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        erro: {
          codigo: 'VALIDACAO',
          mensagem: 'Corpo da requisição inválido',
          detalhes: result.error.flatten(),
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
}