import { entrar } from './auth.js';
import { toast } from './ui.js';

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  if (!email || !senha) return toast('Preencha email e senha', 'falha');
  try {
    await entrar(email, senha);
    location.href = 'inicio.html';
  } catch (err) { toast(err.message || 'Não foi possível entrar', 'falha'); }
});
