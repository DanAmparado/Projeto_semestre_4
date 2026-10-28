import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../lib/logger';

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    erro: {
      codigo: 'NAO_ENCONTRADO',
      mensagem: `Rota ${req.method} ${req.path} não encontrada`,
    },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      erro: {
        codigo: err.codigo,
        mensagem: err.message,
        ...(err.detalhes ? { detalhes: err.detalhes } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      erro: {
        codigo: 'VALIDACAO',
        mensagem: 'Dados inválidos',
        detalhes: err.flatten(),
      },
    });
    return;
  }

  logger.error({ err }, 'Erro não tratado');

  res.status(500).json({
    erro: {
      codigo: 'INTERNO',
      mensagem: 'Erro interno do servidor',
    },
  });
}