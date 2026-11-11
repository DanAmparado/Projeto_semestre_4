import { navbar, toast, mascaraCpf, soDigitos } from './ui.js';
import { apiFetch } from './http.js';
import { HEMOCENTRO_ID } from './config.js';
import { guardFuncionario } from './ui.js';
await guardFuncionario();

await navbar('doador');

const $ = (id) => document.getElementById(id);
const fmtData = (d) => d.slice(0, 10).split('-').reverse().join('/');

mascaraCpf($('cpf'));

let doador = null;

function mostrarMsg(texto) {
  $('msg').textContent = texto;
  $('msg').hidden = false;
}

function limpar() {
  doador = null;
  $('msg').hidden = true;
  $('card').hidden = true;
}

// Ao editar o CPF, o resultado anterior deixa de valer
$('cpf').addEventListener('input', limpar);

$('form-busca').addEventListener('submit', async (e) => {
  e.preventDefault();
  limpar();

  const cpf = soDigitos($('cpf').value);
  if (cpf.length !== 11) return toast('Informe um CPF com 11 dígitos', 'falha');

  $('btn-buscar').disabled = true;
  try {
    doador = await apiFetch(`/hemocentros/${HEMOCENTRO_ID}/doadores?cpf=${cpf}`);

    $('d-nome').textContent = doador.nome_completo;
    $('d-tipo').textContent = doador.tipo_sanguineo;
    $('d-total').textContent = doador.total_doacoes;
    $('d-ultima').textContent = doador.ultima_doacao ? fmtData(doador.ultima_doacao) : 'Nunca doou';
    $('card').hidden = false;
  } catch (err) {
    doador = null;
    if (err.codigo === 'NAO_ENCONTRADO') {
      const cpfBuscado = soDigitos($('cpf').value);
      // Substitui o texto pelo botão de cadastro com o CPF na URL
      $('msg').innerHTML = `
        <div class="alert alert-warning mb-2">Doador não encontrado.</div>
        <button class="btn btn-primary" onclick="window.location.href='novo-cadastro.html?cpf=${cpfBuscado}'">
          Criar conta para este doador
        </button>
      `;
      $('msg').hidden = false;
    } else {
      toast(err.message || 'Erro ao buscar doador', 'falha');
    }
  } finally {
    $('btn-buscar').disabled = false;
  }
});

// Modal de doação
const modal = $('modal');

$('btn-registrar').addEventListener('click', () => {
  $('form-doacao').reset();
  modal.showModal();
});

$('btn-cancelar').addEventListener('click', () => modal.close());

$('form-doacao').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!doador) return;

  const peso = $('peso').value.trim();
  const obs = $('obs').value.trim();
  const pesoOuNull = peso ? Number(peso) : null;
  const obsOuNull = obs || null;

  $('btn-confirmar').disabled = true;
  try {
    const res = await apiFetch(`/hemocentros/${HEMOCENTRO_ID}/doacoes`, {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: doador.id,
        tipo_sanguineo: doador.tipo_sanguineo,
        peso: pesoOuNull,
        observacao: obsOuNull
      })
    });

    modal.close();
    toast(`Doação registrada. Próxima permitida: ${fmtData(res.proxima_doacao_permitida)}`);

    // Atualiza o card com o novo total e a data da doação registrada
    doador.total_doacoes += 1;
    doador.ultima_doacao = res.data_doacao;
    $('d-total').textContent = doador.total_doacoes;
    $('d-ultima').textContent = fmtData(res.data_doacao);
  } catch (err) {
    toast(err.message || 'Falha ao registrar doação', 'falha');
  } finally {
    $('btn-confirmar').disabled = false;
  }
});
