import { navbar, toast, esc } from './ui.js';
import * as api from './servicos.js';

await navbar('relatorios');
const $ = (id) => document.getElementById(id);

// Quais campos cada relatório usa (guia 4.6)
const CAMPOS = {
  'media-doacoes': ['datas'],
  'estudo-doadores': ['datas'],
  'previsao': ['tipo-sang', 'semanas', 'horizonte'],
  'cep': ['sensor', 'datas']
};
api.TIPOS.forEach((t) => $('tipo-sang').insertAdjacentHTML('beforeend', `<option>${t}</option>`));

// Padrões da demo: ao escolher o relatório, os campos já vêm preenchidos
const SENSOR_PADRAO = '9d2b0375-7755-44fc-ad8a-9dcaa93bc71f';
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const diasAtras = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };

const PADROES = {
  'media-doacoes': () => { $('ini').value = diasAtras(30); $('fim').value = ymd(new Date()); },
  'estudo-doadores': () => { $('ini').value = diasAtras(365); $('fim').value = ymd(new Date()); },
  'previsao': () => { $('tipo-sang').value = 'O+'; $('semanas').value = 52; $('horizonte').value = 4; },
  'cep': () => {
    $('ini').value = diasAtras(30); $('fim').value = ymd(new Date());
    if (![...$('sensor').options].some((o) => o.value === SENSOR_PADRAO)) {
      $('sensor').insertAdjacentHTML('beforeend', `<option value="${SENSOR_PADRAO}">Sensor da demo</option>`);
    }
    $('sensor').value = SENSOR_PADRAO;
  }
};

$('tipo').addEventListener('change', async () => {
  const tipo = $('tipo').value;
  const usados = CAMPOS[tipo] || [];
  document.querySelectorAll('[data-campo]').forEach((el) => { el.hidden = !usados.includes(el.dataset.campo); });
  if (usados.includes('sensor') && $('sensor').options.length <= 1) {
    try {
      (await api.sensores()).filter((s) => s.tipo === 'ambiente')
        .forEach((s) => $('sensor').insertAdjacentHTML('beforeend', `<option value="${esc(s.id)}">${esc(s.nome)}</option>`));
    } catch (err) { toast(err.message, 'falha'); }
  }
  if (!PADROES[tipo]) return;
  PADROES[tipo]();
  $('form-relatorio').requestSubmit();   // gera já com os padrões; o usuário pode ajustar e clicar em Gerar
});
const ROTULOS = {
  semana_previsao: 'Semana (início)',
  demanda_prevista: 'Demanda prevista (bolsas)',
  limite_inferior_95: 'Limite inferior 95%',
  limite_superior_95: 'Limite superior 95%',
  componente_tendencia: 'Tendência',
  componente_sazonal: 'Sazonalidade'
};
const rotulo = (k) => ROTULOS[k] ?? k.replaceAll('_', ' ');
const fmt = (v) => {
  if (typeof v === 'number' && !Number.isInteger(v)) return v.toFixed(1);
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v.split('-').reverse().join('/');
  return v;
};
const kpis = (o) => `<div class="kpis">${Object.entries(o).map(([k, v]) => `<div class="kpi"><span>${esc(rotulo(k))}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`;
function tabela(linhas) {
  if (!linhas?.length) return '<p class="resultado__vazio">Sem dados para o período</p>';
  const cols = Object.keys(linhas[0]).filter((c) => !['componente_tendencia', 'componente_sazonal'].includes(c)); return `<table class="tabela"><thead><tr>${cols.map((c) => `<th>${esc(rotulo(c))}</th>`).join('')}</tr></thead><tbody>
    ${linhas.map((l) => `<tr>${cols.map((c) => `<td>${esc(l[c])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

// Gráficos (Chart.js) - cada relatório monta o canvas acima da tabela
const COR = { verde: '#17b01a', amarelo: '#f2c200', vermelho: '#e5201e', vinho: '#8f1812', cinza: '#777' };
const PALETA = ['#8f1812', '#e5201e', '#f08a24', '#f2c200', '#17b01a', '#1f9fb5', '#3b5bdb', '#7b4bb8'];
const canvas = '<div class="grafico-relatorio"><canvas id="grafico-rel"></canvas></div>';
let grafico = null;

function desenhar(config) {
  if (grafico) { grafico.destroy(); grafico = null; }
  const el = $('grafico-rel');
  if (!el || typeof Chart === 'undefined') return;
  grafico = new Chart(el, { ...config, options: { responsive: true, maintainAspectRatio: false, ...config.options } });
}

const DESENHAR = {
  // A) Rosca: distribuição por tipo sanguíneo
  'media-doacoes': (r) => desenhar({
    type: 'doughnut',
    data: {
      labels: r.distribuicao.map((d) => d.tipo),
      datasets: [{ data: r.distribuicao.map((d) => d.quantidade), backgroundColor: PALETA }]
    },
    options: { plugins: { legend: { position: 'right' }, title: { display: true, text: 'Doações por tipo sanguíneo' } } }
  }),

  // B) Barras agrupadas: total x retornaram por faixa etária
  'estudo-doadores': (r) => desenhar({
    type: 'bar',
    data: {
      labels: r.faixas_etarias.map((f) => f.faixa),
      datasets: [
        { label: 'Total', data: r.faixas_etarias.map((f) => f.total), backgroundColor: COR.vinho },
        { label: 'Retornaram', data: r.faixas_etarias.map((f) => f.retornaram), backgroundColor: COR.verde }
      ]
    },
    options: { scales: { y: { beginAtZero: true } }, plugins: { title: { display: true, text: 'Doadores por faixa etária' } } }
  }),

  // C) Linha: previsão com intervalo de 95% preenchido entre os limites
  'previsao': (r) => desenhar({
    type: 'line',
    data: {
      labels: r.map((p) => p.semana_previsao),
      datasets: [
        { label: 'Demanda prevista', data: r.map((p) => p.demanda_prevista), borderColor: COR.vinho, backgroundColor: COR.vinho, borderWidth: 3, tension: 0.2, fill: false },
        { label: 'Limite superior 95%', data: r.map((p) => p.limite_superior_95), borderColor: COR.vermelho, borderDash: [6, 6], borderWidth: 1.5, pointRadius: 0, tension: 0.2, fill: '+1', backgroundColor: 'rgba(229,32,30,0.15)' },
        { label: 'Limite inferior 95%', data: r.map((p) => p.limite_inferior_95), borderColor: COR.vermelho, borderDash: [6, 6], borderWidth: 1.5, pointRadius: 0, tension: 0.2, fill: false }
      ]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Semana (início)' } },
        y: { beginAtZero: true, title: { display: true, text: 'Demanda (bolsas por semana)' } }
      },
      plugins: {
        title: { display: true, text: 'Previsão de demanda' },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(1)} bolsas` } }
      }
    }
  }),

  // D) CEP: pontos coloridos por status + linhas de referência
  'cep': (r) => {
    const corStatus = { normal: COR.verde, fora_controle: COR.amarelo, fora_especificacao: COR.vermelho };
    const cores = r.map((p) => corStatus[p.status_ponto] || COR.cinza);
    const ref = (label, campo, dash) => ({
      label, data: r.map((p) => p[campo]), borderColor: COR.cinza, borderWidth: 1.5,
      borderDash: dash, pointRadius: 0, fill: false
    });
    desenhar({
      type: 'line',
      data: {
        labels: r.map((p) => p.data_leitura),
        datasets: [
          {
            label: 'Temperatura', data: r.map((p) => p.temperatura), borderColor: '#bbb', borderWidth: 1.5,
            pointBackgroundColor: cores, pointBorderColor: cores, pointRadius: 6, pointHoverRadius: 8, fill: false
          },
          ref('Média global', 'media_global', []),
          ref('Limite de controle superior', 'limite_controle_superior', [6, 6]),
          ref('Limite de controle inferior', 'limite_controle_inferior', [6, 6])
        ]
      },
      options: { plugins: { title: { display: true, text: 'Temperatura (verde: normal, amarelo: fora de controle, vermelho: fora de especificação)' } } }
    });
  }
};

// Cada relatório tem um formato próprio (openapi.yaml / guia 4.6): KPIs + gráfico + tabela
const comGrafico = (linhas) => (linhas?.length ? canvas : '');
const RENDER = {
  'media-doacoes': (r) => kpis(r.resumo) + comGrafico(r.distribuicao) + tabela(r.distribuicao),
  'estudo-doadores': (r) => kpis(r.kpis) + comGrafico(r.faixas_etarias) + tabela(r.faixas_etarias),
  'previsao': (r) => comGrafico(r) + tabela(r),
  'cep': (r) => comGrafico(r) + tabela(r)
};

$('form-relatorio').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tipo = $('tipo').value;
  if (!tipo) return toast('Escolha o tipo de relatório', 'falha');
  const params = {};
  if (CAMPOS[tipo].includes('datas')) {
    if (!$('ini').value || !$('fim').value) return toast('Preencha o período', 'falha');
    if ($('ini').value > $('fim').value) return toast('A data inicial deve ser anterior à final', 'falha');
    params.inicio = $('ini').value; params.fim = $('fim').value;
  }
  if (tipo === 'previsao') {
    if (!$('tipo-sang').value) return toast('Escolha o tipo sanguíneo', 'falha');
    params.tipo_sanguineo = $('tipo-sang').value;
    params.semanas = $('semanas').value || 52;
    params.horizonte = $('horizonte').value || 4;
  }
  if (tipo === 'cep') {
    if (!$('sensor').value) return toast('Escolha o sensor', 'falha');
    params.sensor_id = $('sensor').value;
  }
  const box = $('resultado');
  box.innerHTML = '<p class="resultado__vazio">Gerando relatório...</p>';
  try {
    const dados = await api.relatorio(tipo, params);
    if (tipo === 'previsao') dados.sort((a, b) => a.semana_previsao.localeCompare(b.semana_previsao));
    box.innerHTML = RENDER[tipo](dados);
    const temDados = Array.isArray(dados) ? dados.length : true;
    if (temDados) DESENHAR[tipo](dados);
  } catch (err) {
    box.innerHTML = '<p class="resultado__vazio">Não foi possível gerar o relatório</p>';
    toast(err.message, 'falha');
  }
});
