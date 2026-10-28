import { AppError } from './AppError';

export const BadRequest = (mensagem: string, detalhes?: Record<string, unknown>) =>
  new AppError(400, 'VALIDACAO', mensagem, detalhes);

export const Unauthorized = (mensagem = 'Não autenticado') =>
  new AppError(401, 'NAO_AUTENTICADO', mensagem);

export const Forbidden = (mensagem = 'Sem permissão para esta ação') =>
  new AppError(403, 'NAO_AUTORIZADO', mensagem);

export const NotFound = (mensagem = 'Recurso não encontrado') =>
  new AppError(404, 'NAO_ENCONTRADO', mensagem);

export const Conflict = (mensagem: string) => new AppError(409, 'CONFLITO', mensagem);

export const Internal = (mensagem = 'Erro interno do servidor') =>
  new AppError(500, 'INTERNO', mensagem);