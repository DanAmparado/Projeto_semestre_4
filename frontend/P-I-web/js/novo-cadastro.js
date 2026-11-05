import { navbar, toast, mascaraCpf, mascaraTelefone, cpfValido, soDigitos } from './ui.js';
import { cadastrar } from './auth.js';
import { completarPerfil } from './servicos.js';

await navbar('cadastro');
const $ = (id) => document.getElementById(id);
mascaraCpf($('cpf')); mascaraTelefone($('tel'));

$('form-cadastro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = (id) => $(id).value.trim();
  if (['nome', 'cpf', 'nasc', 'sexo', 'tipo', 'tel', 'peso', 'email', 'senha'].some((id) => !v(id))) return toast('Preencha todos os campos', 'falha');
  if (!cpfValido(v('cpf'))) return toast('CPF inválido', 'falha');
  if (v('senha').length < 6) return toast('A senha precisa ter ao menos 6 caracteres', 'falha');
  if ($('senha').value !== $('confirma').value) return toast('As senhas não coincidem', 'falha');
  try {
    // Passo 1: cria conta no Supabase Auth
    const token = await cadastrar(v('email'), $('senha').value);
    // Passo 2: completa o perfil no backend (a senha não vai para o /me)
    await completarPerfil(token, {
      nome_completo: v('nome'),
      cpf: soDigitos(v('cpf')),
      data_nascimento: v('nasc'),      // YYYY-MM-DD
      sexo: v('sexo'),                 // 'M' | 'F' | 'O'
      tipo_sanguineo: v('tipo'),
      telefone: v('tel'),
      peso: +v('peso')
    });
    toast('Cadastro feito com sucesso!');
    $('form-cadastro').reset();
  } catch (err) { toast(err.message || 'Falha no cadastro', 'falha'); }   // 409: CPF já cadastrado
});
