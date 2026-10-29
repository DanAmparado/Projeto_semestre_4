import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

function erroValidacao(res: Response, mensagem: string, detalhes: unknown): void {
  res.status(400).json({
    erro: { codigo: 'VALIDACAO', mensagem, detalhes },
  });
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      erroValidacao(res, 'Corpo da requisição inválido', result.error.flatten());
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      erroValidacao(res, 'Parâmetros de rota inválidos', result.error.flatten());
      return;
    }
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      erroValidacao(res, 'Query string inválida', result.error.flatten());
      return;
    }
    // req.query é getter no Express 4; salvamos num campo separado
    (req as any).validatedQuery = result.data;
    next();
  };
}