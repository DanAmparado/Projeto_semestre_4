/**
 * Camada de comunicação com o back-end.
 * 1) Ajuste API_URL (use o IP da máquina do back-end, não "localhost", ao testar no celular).
 * 2) Mude USE_MOCK para false.
 * 3) Adapte as rotas/campos abaixo ao que o back-end realmente expõe (marcado com TODO).
 */
import { Doacao, NivelSangue, RegisterData, User } from '../types';

export const API_URL = 'http://192.168.0.10:3000';
export const USE_MOCK = true;

let authToken: string | null = null;
export const setToken = (t: string | null) => {
  authToken = t;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...((init.headers as Record<string, string>) || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || body?.erro || 'Erro ao comunicar com o servidor.');
  return body as T;
}

const wait = (ms = 500) => new Promise((r) => setTimeout(r, ms));

// ---------- MOCK ----------
const mockUser: User = {
  id: '1',
  nome: 'Usuário Exemplo',
  email: 'usuario@email.com',
  cpf: '000.000.000-00',
  telefone: '(16) 90000-0000',
  dataNascimento: '01/01/2000',
  genero: 'Masculino',
  tipoSanguineo: 'O+',
  pessoasAjudadas: 3,
};

// ---------- API ----------
export const api = {
  async login(email: string, senha: string): Promise<{ token: string; user: User }> {
    if (USE_MOCK) {
      await wait();
      return { token: 'mock', user: { ...mockUser, email } };
    }
    // TODO: ajustar rota e formato da resposta
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
  },

  async register(data: RegisterData): Promise<{ token: string; user: User }> {
    if (USE_MOCK) {
      await wait();
      const { senha: _senha, ...rest } = data;
      return { token: 'mock', user: { ...mockUser, ...rest } };
    }
    // TODO: ajustar rota e nomes dos campos (ex.: dataNascimento em ISO)
    return request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  },

  async getNiveis(cidade: string, estado: string): Promise<NivelSangue[]> {
    if (USE_MOCK) {
      await wait();
      return [
        { tipo: '+A', nivel: 90 }, { tipo: '-A', nivel: 45 }, { tipo: '+B', nivel: 56 }, { tipo: '-B', nivel: 38 },
        { tipo: '+AB', nivel: 75 }, { tipo: '-AB', nivel: 69 }, { tipo: '+O', nivel: 54 }, { tipo: '-O', nivel: 45 },
      ];
    }
    // TODO: ajustar rota/query
    return request(`/hemocentros/niveis?cidade=${encodeURIComponent(cidade)}&estado=${estado}`);
  },

  async getDoacoes(): Promise<Doacao[]> {
    if (USE_MOCK) {
      await wait();
      return [
        { id: '1', data: '10/08/2026', local: 'Centro de Hematologia' },
        { id: '2', data: '12/05/2026', local: 'Hemocentro Regional' },
      ];
    }
    return request('/doacoes'); // TODO
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    if (USE_MOCK) {
      await wait();
      return { ...mockUser, ...data };
    }
    return request('/usuarios/me', { method: 'PUT', body: JSON.stringify(data) }); // TODO
  },
};
