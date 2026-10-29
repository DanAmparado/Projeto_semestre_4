import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { Unauthorized } from '../errors/httpErrors';
import { errorHandler } from './error';

/**
 * Valida o header `x-iot-key` para ingestão de leituras de dispositivos IoT.
 * Usar apenas nas rotas sob /iot.
 */
export function iotKey(req: Request, res: Response, next: NextFunction): void {
  try {
    const key = req.header('x-iot-key');
    if (!key || key !== env.IOT_KEY) {
      throw Unauthorized('Chave IoT ausente ou inválida');
    }
    next();
  } catch (err) {
    errorHandler(err, req, res, next);
  }
}