import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny, z } from 'zod';

function erroValidacao(res: Response, mensagem: string, detalhes: unknown): void {
  res.status(400).json({
    erro: { codigo: 'VALIDACAO', mensagem, detalhes },
  });
}

export function validateBody<S extends ZodTypeAny>(schema: S) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      erroValidacao(res, 'Corpo da requisição inválido', result.error.flatten());
      return;
    }
    req.body = result.data as z.infer<S>;
    next();
  };
}

export function validateParams<S extends ZodTypeAny>(schema: S) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      erroValidacao(res, 'Parâmetros de rota inválidos', result.error.flatten());
      return;
    }
    next();
  };
}

export function validateQuery<S extends ZodTypeAny>(schema: S) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      erroValidacao(res, 'Query string inválida', result.error.flatten());
      return;
    }
    (req as any).validatedQuery = result.data as z.infer<S>;
    next();
  };
}