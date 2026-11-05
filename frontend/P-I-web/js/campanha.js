import { navbar, toast } from './ui.js';
import { apiFetch } from './http.js';
import { HEMOCENTRO_ID } from './config.js';

await navbar('campanha');

const $ = (id) => document.getElementById(id);

$('mensagem').addEventListener('input', () => {
  $('contador').textContent = `${$('mensagem').value.length}/500`;
});

$('form-campanha').addEventListener('submit', async (e) => {
  e.preventDefault();

  const tipo_sanguineo = $('tipo').value;
  const titulo = $('titulo').value.trim();
  const mensagem = $('mensagem').value.trim();
  const canal = $('canal').value || 'app';

  if (!tipo_sanguineo || !titulo || !mensagem) {
    return toast('Preencha tipo sanguíneo, título e mensagem', 'falha');
  }

  $('btn-enviar').disabled = true;
  try {
    const res = await apiFetch(`/hemocentros/${HEMOCENTRO_ID}/campanhas`, {
      method: 'POST',
      body: JSON.stringify({ tipo_sanguineo, titulo, mensagem, canal })
    });

    toast(`Campanha enviada para ${res.total_notificados} doador(es)`);
    $('form-campanha').reset();
    $('canal').value = 'app';
    $('contador').textContent = '0/500';
  } catch (err) {
    toast(err.message || 'Falha ao enviar campanha', 'falha');
  } finally {
    $('btn-enviar').disabled = false;
  }
});
