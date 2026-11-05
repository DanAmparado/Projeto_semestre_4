import { navbar, toast, esc } from './ui.js';
import * as api from './servicos.js';

await navbar('inicio');

// Estoque
const grafico = document.getElementById('grafico');
const rotulos = document.getElementById('rotulos');
api.TIPOS.forEach((t) => {
  grafico.insertAdjacentHTML('beforeend', `<div class="grafico__col"><div class="grafico__barra" data-tipo="${t}" style="height:0"></div></div>`);
  rotulos.insertAdjacentHTML('beforeend', `<span>${t}</span>`);
});

// Mesma classificação do dashboard do backend: crítico <= nivel_critico, baixo <= nivel_minimo
const nivel = (i) => i.quantidade_bolsas <= i.nivel_critico ? 'crítico' : i.quantidade_bolsas <= i.nivel_minimo ? 'baixo' : 'normal';

async function carregarEstoque() {
  try {
    const itens = await api.estoque();
    const por = Object.fromEntries(itens.map((i) => [i.tipo_sanguineo, i]));
    const max = Math.max(1, ...itens.map((i) => i.quantidade_bolsas));
    api.TIPOS.forEach((t) => {
      const b = grafico.querySelector(`[data-tipo="${t}"]`);
      const i = por[t];
      b.style.height = `${((i?.quantidade_bolsas ?? 0) / max) * 95}%`;
      b.title = i ? `${t}: ${i.quantidade_bolsas} bolsas (${nivel(i)})` : `${t}: sem dados`;
    });
  } catch (err) { toast(err.message, 'falha'); }
}

// Câmara fria: sensor de ambiente + leitura mais recente (a API devolve a mais recente primeiro)
async function carregarCamara() {
  try {
    const sensor = (await api.sensores()).find((s) => s.tipo === 'ambiente');
    if (!sensor) throw new Error('Nenhum sensor de ambiente cadastrado');
    const [l] = await api.leituras(sensor.id, 20);
    if (!l) throw new Error('Sem leituras para o sensor');
    document.getElementById('temp').textContent = `${l.temperatura}°`;
    document.getElementById('umid').textContent = `${l.umidade}%`;
    const a = document.getElementById('alerta-camara');
    a.textContent = l.alerta ? 'Alerta' : 'Normal';
    a.style.borderColor = l.alerta ? 'var(--vermelho)' : 'var(--verde-btn)';
  } catch (err) {
    ['temp', 'umid'].forEach((id) => { document.getElementById(id).textContent = '--'; });
  }
}

// Alertas pendentes (gerados no banco; o front só lista e resolve)
const lista = document.getElementById('alertas');
async function carregarAlertas() {
  try {
    const alertas = await api.alertasPendentes();
    lista.innerHTML = alertas.length ? alertas.map((a) => `
      <li class="alerta__item alerta__item--${esc(a.severidade)}">
        <span>${esc(a.mensagem)}</span>
        <button class="btn" type="button" data-id="${esc(a.id)}">Resolver</button>
      </li>`).join('') : '<li class="alerta__vazio">Nenhum alerta pendente</li>';
  } catch (err) { toast(err.message, 'falha'); }
}
lista.addEventListener('click', async (e) => {
  const id = e.target.dataset?.id;
  if (!id) return;
  try { await api.resolverAlerta(id); toast('Alerta resolvido'); carregarAlertas(); }
  catch (err) { toast(err.message, 'falha'); }
});

const tudo = () => { carregarEstoque(); carregarCamara(); carregarAlertas(); };
tudo();
setInterval(tudo, 15000);
