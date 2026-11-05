import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { env } from '../config/env';
import { logger } from '../lib/logger';

function erroBody(codigo: string, mensagem: string, detalhes?: unknown) {
  return {
    erro: {
      codigo,
      mensagem,
      ...(detalhes !== undefined ? { detalhes } : {}),
    },
  };
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json(
    erroBody('NAO_ENCONTRADO', `Rota ${req.method} ${req.path} não encontrada`)
  );
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProd = env.NODE_ENV === 'production';

  if (err instanceof AppError) {
    // Em produção, erros 5xx nunca vazam a mensagem interna original.
    // O detalhe completo fica só no log do servidor.
    if (isProd && err.status >= 500) {
      logger.error({ err }, 'AppError 5xx');
      res.status(err.status).json(erroBody('INTERNO', 'Erro interno do servidor'));
      return;
    }

    res.status(err.status).json(erroBody(err.codigo, err.message, err.detalhes));
    return;
  }

  if (err instanceof ZodError) {
    // Detalhes de validação são úteis para o cliente (front/mobile monta mensagens)
    res.status(400).json(erroBody('VALIDACAO', 'Dados inválidos', err.flatten()));
    return;
  }

  logger.error({ err }, 'Erro não tratado');
  res.status(500).json(erroBody('INTERNO', 'Erro interno do servidor'));
}