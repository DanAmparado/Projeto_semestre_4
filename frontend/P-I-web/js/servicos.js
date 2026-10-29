import { apiFetch } from './http.js';
import { HEMOCENTRO_ID as H } from './config.js';

export const TIPOS = ['A-', 'A+', 'B-', 'B+', 'AB-', 'AB+', 'O-', 'O+'];
const json = (o) => JSON.stringify(o);

// 4.1 Estoque (tela do funcionário logado)
export const estoque = () => apiFetch(`/hemocentros/${H}/estoque`);

// 4.2 Câmara fria
export const sensores = () => apiFetch(`/hemocentros/${H}/sensores`);
export const leituras = (sensorId, limit = 20) =>
  apiFetch(`/hemocentros/${H}/sensores/${sensorId}/leituras?limit=${limit}`);

// 4.3 Alertas (só leitura + resolver; alertas são gerados por trigger no banco)
export const alertasPendentes = () => apiFetch(`/hemocentros/${H}/alertas?resolvido=false`);
export const resolverAlerta = (id) => apiFetch(`/alertas/${id}/resolver`, { method: 'PATCH' });

// 4.4 Doadores (busca por CPF, só dígitos)
export const buscarDoador = (cpf) => apiFetch(`/hemocentros/${H}/doadores?cpf=${cpf}`);

// 4.5 Doações
export const registrarDoacao = (d) =>
  apiFetch(`/hemocentros/${H}/doacoes`, { method: 'POST', body: json(d) });

// 4.6 Relatórios: tipo = media-doacoes | estudo-doadores | previsao | cep
export const relatorio = (tipo, params) =>
  apiFetch(`/hemocentros/${H}/relatorios/${tipo}?${new URLSearchParams(params)}`);

// 2.4 passo 2: completa perfil no backend (usa o token recém-criado)
export const completarPerfil = (token, dados) =>
  apiFetch('/me', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: json(dados) });
