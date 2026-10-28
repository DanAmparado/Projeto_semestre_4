import { NextFunction, Request, Response } from 'express';
import { supabaseAuth } from '../lib/supabase';
import { Unauthorized } from '../errors/httpErrors';
import { errorHandler } from './error';

export async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw Unauthorized('Token ausente ou mal formatado');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) throw Unauthorized('Token vazio');

    const { data, error } = await supabaseAuth.auth.getUser(token);

    if (error || !data.user) {
      throw Unauthorized('Token inválido ou expirado');
    }

    req.user = data.user;
    next();
  } catch (err) {
    errorHandler(err, req, res, next);
  }
}