/**
 * Endpoints do mobile, conforme docs/api/openapi.yaml (base: /api/v1).
 * Login e cadastro (Supabase Auth) ficam em src/context/AuthContext.tsx.
 */
import { Doacao, EstoqueHemocentro, NivelSangue, Notificacao, StatusNivel, User } from '../types';
import { maskCpf, maskPhone } from '../utils/masks';
import { apiFetch } from './http';

// ---------- conversões API <-> app ----------
const isoToBr = (d?: string | null) => (d ? d.slice(0, 10).split('-').reverse().join('/') : '');
const brToIso = (d: string) => d.split('/').reverse().join('-');

const SEXO_PARA_GENERO: Record<string, string> = { M: 'Masculino', F: 'Feminino', O: 'Outro' };
const GENERO_PARA_SEXO: Record<string, 'M' | 'F' | 'O'> = {
  Masculino: 'M',
  Feminino: 'F',
  Outro: 'O',
  'Prefiro não informar': 'O',
};
export const generoParaSexo = (g: string) => GENERO_PARA_SEXO[g] ?? 'O';

type MeDTO = {
  id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  tipo_sanguineo?: string | null;
  telefone?: string | null;
  sexo?: 'M' | 'F' | 'O' | null;
  total_doacoes?: number;
  pontos?: number;
  ultima_doacao?: string | null;
};

export function mapUser(me: MeDTO, email: string): User {
  return {
    id: me.id,
    nome: me.nome_completo,
    email,
    cpf: maskCpf(me.cpf ?? ''),
    telefone: maskPhone(me.telefone ?? ''),
    dataNascimento: isoToBr(me.data_nascimento),
    genero: me.sexo ? SEXO_PARA_GENERO[me.sexo] : '',
    tipoSanguineo: me.tipo_sanguineo ?? undefined,
    totalDoacoes: me.total_doacoes ?? 0,
    pontos: me.pontos ?? 0,
    ultimaDoacao: me.ultima_doacao ?? null,
  };
}

// Corpo do PATCH /me a partir dos dados do app
export function toPatchBody(d: Partial<User>) {
  return {
    ...(d.nome !== undefined && { nome_completo: d.nome }),
    ...(d.cpf !== undefined && { cpf: d.cpf.replace(/\D/g, '') }),
    ...(d.dataNascimento !== undefined && { data_nascimento: brToIso(d.dataNascimento) }),
    ...(d.genero !== undefined && { sexo: generoParaSexo(d.genero) }),
    ...(d.telefone !== undefined && { telefone: d.telefone }),
    ...(d.tipoSanguineo !== undefined && { tipo_sanguineo: d.tipoSanguineo }),
  };
}

// ---------- estoque ----------
type EstoqueDTO = {
  hemocentro: { id: string; nome: string; cidade: string; estado: string };
  estoque: { tipo_sanguineo: string; quantidade_bolsas: number; nivel_critico: number; nivel_minimo: number }[];
};

const ORDEM_TIPOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
// "O+" (API) -> "+O" (rótulo do Figma)
const rotulo = (t: string) => `${t.slice(-1)}${t.slice(0, -1)}`;

/**
 * Status segue a regra do back-end (dashboard.service.ts):
 *   quantidade <= nivel_critico -> critico | <= nivel_minimo -> baixo | acima -> normal
 * A altura da barra (%) é só escala visual: 100% = 2x o nível mínimo.
 */
function classificar(qtd: number, critico: number, minimo: number): { nivel: number; status: StatusNivel } {
  const nivel = Math.min(100, Math.round((qtd / Math.max(minimo * 2, 1)) * 100));
  const status: StatusNivel = qtd <= critico ? 'critico' : qtd <= minimo ? 'baixo' : 'normal';
  return { nivel, status };
}

// ---------- chamadas ----------
export const api = {
  /** GET /publico/estoque?cidade=&estado= */
  async getEstoquePorCidade(cidade: string, estado: string): Promise<EstoqueHemocentro[]> {
    const q = `cidade=${encodeURIComponent(cidade)}&estado=${encodeURIComponent(estado.toUpperCase())}`;
    const res = await apiFetch<EstoqueDTO[]>(`/publico/estoque?${q}`);
    return res
      .map((r) => {
        const niveis: NivelSangue[] = ORDEM_TIPOS.flatMap((tipo) => {
          const e = r.estoque.find((x) => x.tipo_sanguineo === tipo);
          if (!e) return [];
          return [{ tipo: rotulo(tipo), ...classificar(e.quantidade_bolsas, e.nivel_critico, e.nivel_minimo) }];
        });
        return { hemocentro: r.hemocentro, niveis };
      });
  },

  /** GET /me/doacoes (+ GET /publico/hemocentros para trazer o nome do local) */
  async getDoacoes(): Promise<Doacao[]> {
    const [doacoes, hemocentros] = await Promise.all([
      apiFetch<
        { id: string; tipo_sanguineo: string; data_doacao: string; status: string; hemocentro_id: string }[]
      >('/me/doacoes'),
      apiFetch<{ id: string; nome: string }[]>('/publico/hemocentros').catch(() => []),
    ]);
    const nomes = new Map(hemocentros.map((h) => [h.id, h.nome]));
    return doacoes
      .filter((d) => d.status === 'realizada') // "doações feitas"
      .map((d) => ({
        id: d.id,
        tipoSanguineo: d.tipo_sanguineo,
        data: isoToBr(d.data_doacao),
        status: d.status,
        hemocentroId: d.hemocentro_id,
        local: nomes.get(d.hemocentro_id) ?? '—',
      }));
  },

  /** GET /me */
  getMe: () => apiFetch<MeDTO>('/me'),

  /** PATCH /me (devolve o perfil completo atualizado, igual ao GET /me) */
  patchMe: (body: object) => apiFetch<MeDTO>('/me', { method: 'PATCH', body: JSON.stringify(body) }),

  /** GET /me/notificacoes */
  getNotificacoes: () => apiFetch<Notificacao[]>('/me/notificacoes'),

  /** PATCH /me/notificacoes/:id/lida */
  marcarNotificacaoLida: (id: string) => apiFetch<unknown>(`/me/notificacoes/${id}/lida`, { method: 'PATCH' }),
};
