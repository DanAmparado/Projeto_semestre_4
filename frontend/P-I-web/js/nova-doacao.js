import { navbar, toast, mascaraCpf, cpfValido, soDigitos, esc } from './ui.js';
import * as api from './servicos.js';

await navbar('doacao');
const $ = (id) => document.getElementById(id);
mascaraCpf($('cpf'));

let doador = null;   // doador encontrado por CPF (funcionário não cadastra doador)
const status = $('status'), btnDoar = $('btn-doar');

// Regras de exemplo da tela (a validação oficial é do backend; peso mínimo da API = 50 kg)
function elegivel() {
  const peso = +$('peso').value, oxi = +$('oxi').value, bpm = +$('bpm').value, pmin = +$('pmin').value, pmax = +$('pmax').value;
  if (!(peso && oxi && bpm && pmin && pmax)) return null;
  return peso >= 50 && oxi >= 95 && bpm >= 50 && bpm <= 100 && pmax >= 100 && pmax <= 180 && pmin >= 60 && pmin <= 100;
}
function atualizar() {
  const ok = elegivel();
  status.className = 'pode-doar__status' + (ok === null ? '' : ok ? ' pode-doar__status--sim' : ' pode-doar__status--nao');
  status.textContent = ok === null ? '--' : ok ? 'Sim' : 'Não';
  btnDoar.disabled = !(ok && doador);
}
['peso', 'oxi', 'bpm', 'pmin', 'pmax'].forEach((id) => $(id).addEventListener('input', atualizar));
$('cpf').addEventListener('input', () => { doador = null; $('doador').hidden = true; atualizar(); });

$('btn-conferir').addEventListener('click', async () => {
  if (!cpfValido($('cpf').value)) return toast('CPF inválido', 'falha');
  try {
    doador = await api.buscarDoador(soDigitos($('cpf').value));
    $('doador').hidden = false;
    $('doador').innerHTML = `<strong>${esc(doador.nome_completo)}</strong><br>
      Tipo sanguíneo: ${esc(doador.tipo_sanguineo)}<br>
      Doações realizadas: ${esc(doador.total_doacoes)}<br>
      Última doação: ${doador.ultima_doacao ? esc(doador.ultima_doacao.split('-').reverse().join('/')) : 'nenhuma'}`;
    atualizar();
  } catch (err) {
    doador = null; $('doador').hidden = true; atualizar();
    toast(err.message, 'falha');   // 404: "Doador não encontrado"
  }
});

btnDoar.addEventListener('click', async () => {
  const obs = $('obs').value.trim();
  const dados = { usuario_id: doador.id, tipo_sanguineo: doador.tipo_sanguineo, peso: +$('peso').value, ...(obs && { observacao: obs }) };
  try {
    const r = await api.registrarDoacao(dados);
    toast(`Doação registrada! Próxima permitida em ${r.proxima_doacao_permitida.split('-').reverse().join('/')}`);
    $('form-doacao').reset(); doador = null; $('doador').hidden = true; atualizar();
  } catch (err) { toast(err.message || 'Falha ao registrar doação', 'falha'); }
});
