// Respostas de exemplo seguindo o openapi.yaml v1.8.0 (usado só com USAR_MOCK = true)
const TIPOS = ['A-', 'A+', 'B-', 'B+', 'AB-', 'AB+', 'O-', 'O+'];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const erro = (codigo, msg) => Object.assign(new Error(msg), { codigo });
const rand = (a, b) => Math.round(a + Math.random() * (b - a));

export async function mock(path, options = {}) {
  await espera(200);
  const [rota, qs = ''] = path.split('?');
  const q = new URLSearchParams(qs);
  const metodo = (options.method || 'GET').toUpperCase();

  if (/\/estoque$/.test(rota))
    return TIPOS.map((t) => ({ tipo_sanguineo: t, quantidade_bolsas: rand(3, 60), nivel_minimo: 10, nivel_critico: 5, updated_at: new Date().toISOString() }));

  if (/\/sensores$/.test(rota))
    return [
      { id: 'sensor-1', nome: 'Câmara fria 1', tipo: 'ambiente', status: 'ativo' },
      { id: 'sensor-2', nome: 'Balança 1', tipo: 'balanca', status: 'ativo' }
    ];

  if (/\/leituras$/.test(rota))
    return Array.from({ length: Number(q.get('limit')) || 20 }, (_, i) => ({
      id: i, created_at: new Date(Date.now() - i * 60000).toISOString(),
      temperatura: +(3 + Math.random() * 2).toFixed(1), umidade: +(60 + Math.random() * 5).toFixed(1), alerta: false
    }));

  if (/\/alertas\/[^/]+\/resolver$/.test(rota)) return null;

  if (/\/alertas$/.test(rota))
    return [
      { id: 'a1', tipo: 'estoque_critico', severidade: 'critico', mensagem: 'Estoque crítico de O-', resolvido: false, created_at: new Date().toISOString() },
      { id: 'a2', tipo: 'estoque_baixo', severidade: 'aviso', mensagem: 'Estoque baixo de B-', resolvido: false, created_at: new Date().toISOString() }
    ];

  if (/\/doadores$/.test(rota)) {
    const cpf = q.get('cpf') || '';
    if (!/^\d{11}$/.test(cpf)) throw erro('VALIDACAO', 'CPF deve ter 11 dígitos');
    if (cpf.endsWith('00')) throw erro('NAO_ENCONTRADO', 'Doador não encontrado');
    return { id: '11111111-1111-1111-1111-111111111111', nome_completo: 'Maria Silva', tipo_sanguineo: 'O+', total_doacoes: 3, ultima_doacao: '2026-08-15' };
  }

  if (/\/doacoes$/.test(rota) && metodo === 'POST') {
    const hoje = new Date(), prox = new Date(hoje.getTime() + 90 * 864e5);
    const f = (d) => d.toISOString().slice(0, 10);
    return { id: 'd-1', data_doacao: f(hoje), proxima_doacao_permitida: f(prox), movimentacao_id: 'm-1' };
  }

  if (/\/relatorios\/media-doacoes$/.test(rota))
    return { resumo: { total_doacoes: 124, media_diaria: 4.1, doadores_unicos: 98 }, distribuicao: TIPOS.map((t) => ({ tipo: t, quantidade: rand(4, 30) })) };

  if (/\/relatorios\/estudo-doadores$/.test(rota))
    return { kpis: { total_doadores: 210, taxa_retorno_pct: 46.5 }, faixas_etarias: [
      { faixa: '18-25', total: 60, retornaram: 22 }, { faixa: '26-35', total: 80, retornaram: 41 },
      { faixa: '36-50', total: 50, retornaram: 28 }, { faixa: '51+', total: 20, retornaram: 7 }] };

  if (/\/relatorios\/previsao$/.test(rota))
    return Array.from({ length: 4 }, (_, i) => {
      const d = rand(20, 40);
      return { semana_previsao: `Semana +${i + 1}`, demanda_prevista: d, limite_inferior_95: d - 6, limite_superior_95: d + 6 };
    });

  if (/\/relatorios\/cep$/.test(rota))
    return Array.from({ length: 6 }, (_, i) => ({
      data_leitura: `2026-10-${String(20 + i).padStart(2, '0')}`, temperatura: +(3 + Math.random() * 2).toFixed(1), umidade: rand(58, 66),
      media_global: 4.0, limite_controle_superior: 6.0, limite_controle_inferior: 2.0, status_ponto: 'dentro'
    }));

  if (rota === '/me' && metodo === 'PATCH') return { id: 'u-1', ...JSON.parse(options.body || '{}'), total_doacoes: 0, pontos: 0, ultima_doacao: null };

  throw erro('NAO_ENCONTRADO', 'Rota não encontrada (mock)');
}
