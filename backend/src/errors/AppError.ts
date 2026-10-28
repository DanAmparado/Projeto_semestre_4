export type ErrorCode =
  | 'VALIDACAO'
  | 'NAO_AUTENTICADO'
  | 'NAO_AUTORIZADO'
  | 'NAO_ENCONTRADO'
  | 'CONFLITO'
  | 'INTERNO';

export class AppError extends Error {
  public readonly status: number;
  public readonly codigo: ErrorCode;
  public readonly detalhes?: Record<string, unknown>;

  constructor(
    status: number,
    codigo: ErrorCode,
    mensagem: string,
    detalhes?: Record<string, unknown>
  ) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
    this.name = 'AppError';
  }
}