import { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { Forbidden } from '../errors/httpErrors';
import { errorHandler } from './error';

/**
 * Verifica se o usuário autenticado é funcionário ativo
 * do hemocentro informado em req.params.id.
 * Deve ser usado depois do middleware `auth`.
 */
export async function autorizarFuncionario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw Forbidden('Usuário não autenticado');

    const hemocentroId = req.params.id;
    if (!hemocentroId) throw Forbidden('Hemocentro não informado');

    const { data, error } = await supabaseAdmin
      .from('hemocentro_usuarios')
      .select('role, ativo')
      .eq('user_id', req.user.id)
      .eq('hemocentro_id', hemocentroId)
      .eq('ativo', true)
      .maybeSingle();

    if (error || !data) {
      throw Forbidden('Sem acesso a este hemocentro');
    }

    req.funcionario = {
      role: data.role as 'admin' | 'operador' | 'visualizador',
      ativo: data.ativo,
    };

    next();
  } catch (err) {
    errorHandler(err, req, res, next);
  }
}