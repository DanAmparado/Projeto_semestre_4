import { navbar, toast, esc } from './ui.js';
import * as api from './servicos.js';

await navbar('relatorios');
const $ = (id) => document.getElementById(id);

// Quais campos cada relatório usa (guia 4.6)
const CAMPOS = {
  'media-doacoes': ['datas'],
  'estudo-doadores': ['datas'],
  'previsao': ['tipo-sang', 'semanas'],
  'cep': ['sensor', 'datas']
};
api.TIPOS.forEach((t) => $('tipo-sang').insertAdjacentHTML('beforeend', `<option>${t}</option>`));

$('tipo').addEventListener('change', async () => {
  const usados = CAMPOS[$('tipo').value] || [];
  document.querySelectorAll('[data-campo]').forEach((el) => { el.hidden = !usados.includes(el.dataset.campo); });
  if (usados.includes('sensor') && $('sensor').options.length <= 1) {
    try {
      (await api.sensores()).filter((s) => s.tipo === 'ambiente')
        .forEach((s) => $('sensor').insertAdjacentHTML('beforeend', `<option value="${esc(s.id)}">${esc(s.nome)}</option>`));
    } catch (err) { toast(err.message, 'falha'); }
  }
});

const rotulo = (k) => k.replaceAll('_', ' ');
const kpis = (o) => `<div class="kpis">${Object.entries(o).map(([k, v]) => `<div class="kpi"><span>${esc(rotulo(k))}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`;
function tabela(linhas) {
  if (!linhas?.length) return '<p class="resultado__vazio">Sem dados para o período</p>';
  const cols = Object.keys(linhas[0]);
  return `<table class="tabela"><thead><tr>${cols.map((c) => `<th>${esc(rotulo(c))}</th>`).join('')}</tr></thead><tbody>
    ${linhas.map((l) => `<tr>${cols.map((c) => `<td>${esc(l[c])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

// Cada relatório tem um formato próprio (openapi.yaml / guia 4.6)
const RENDER = {
  'media-doacoes': (r) => kpis(r.resumo) + tabela(r.distribuicao),
  'estudo-doadores': (r) => kpis(r.kpis) + tabela(r.faixas_etarias),
  'previsao': tabela,
  'cep': tabela
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
  }
  if (tipo === 'cep') {
    if (!$('sensor').value) return toast('Escolha o sensor', 'falha');
    params.sensor_id = $('sensor').value;
  }
  const box = $('resultado');
  box.innerHTML = '<p class="resultado__vazio">Gerando relatório...</p>';
  try {
    box.innerHTML = RENDER[tipo](await api.relatorio(tipo, params));
  } catch (err) {
    box.innerHTML = '<p class="resultado__vazio">Não foi possível gerar o relatório</p>';
    toast(err.message, 'falha');
  }
});
