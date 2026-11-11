import { navbar, toast, mascaraCpf, mascaraTelefone, cpfValido, soDigitos, guardFuncionario } from './ui.js';
import { apiFetch } from './http.js';
import { HEMOCENTRO_ID } from './config.js';

await guardFuncionario();
await navbar('cadastro');

const $ = (id) => document.getElementById(id);
mascaraCpf($('cpf')); 
mascaraTelefone($('tel'));

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const cpfUrl = params.get('cpf');
  if (cpfUrl) {
    $('cpf').value = cpfUrl;
  }
});

$('form-cadastro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = (id) => $(id).value.trim();
  
  if (['nome', 'cpf', 'nasc', 'sexo', 'tipo', 'tel', 'peso', 'email'].some((id) => !v(id))) {
    return toast('Preencha todos os campos', 'falha');
  }
  if (!cpfValido(v('cpf'))) return toast('CPF inválido', 'falha');
  
  try {
    const payload = {
      nome_completo: v('nome'),
      cpf: soDigitos(v('cpf')),
      data_nascimento: v('nasc'),      // YYYY-MM-DD
      sexo: v('sexo'),                 // 'M' | 'F' | 'O'
      tipo_sanguineo: v('tipo'),
      telefone: v('tel'),
      peso: +v('peso'),
      email: v('email')
    };

    const res = await apiFetch(`/hemocentros/${HEMOCENTRO_ID}/doadores`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    toast('Cadastro feito com sucesso!');
    $('form-cadastro').reset();

    if ($('modal-senha')) {
      $('email-temporario').textContent = v('email');
      $('senha-temporaria').textContent = res.senha_temporaria;
      $('modal-senha').showModal();
    } else {
      alert(`Doador cadastrado!\n\nEmail: ${v('email')}\nSenha Temporária: ${res.senha_temporaria}\n\nCopie esta senha e entregue ao doador.`);
    }

  } catch (err) { 
    toast(err.message || 'Falha no cadastro', 'falha'); 
  }
});


if ($('btn-copiar')) {
  $('btn-copiar').addEventListener('click', () => {
    const senha = $('senha-temporaria').textContent;
    navigator.clipboard.writeText(senha);
    toast('Senha temporária copiada!');
  });
}

if ($('btn-fechar-modal')) {
  $('btn-fechar-modal').addEventListener('click', () => {
    $('modal-senha').close();
  });
}