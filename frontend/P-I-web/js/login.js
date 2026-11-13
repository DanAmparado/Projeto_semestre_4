import { entrar } from './auth.js';
import { toast } from './ui.js';
import { supabase } from './supabase.js';
import { API_URL } from './config.js';

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  if (!email || !senha) return toast('Preencha email e senha', 'falha');

  try {
    await entrar(email, senha);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sessão não estabelecida');

    const res = await fetch(`${API_URL}/me/papel`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });
    const papel = await res.json();

    if (!papel.eh_funcionario) {
      await supabase.auth.signOut();
      toast('Painel exclusivo para funcionários. Baixe o app para doadores.', 'falha');
      return;
    }

    location.href = 'inicio.html';
  } catch (err) {
    toast(err.message || 'Não foi possível entrar', 'falha');
  }
});

// Se chegou via redirect de acesso restrito (guardFuncionario)
const params = new URLSearchParams(location.search);
if (params.get('erro') === 'acesso-restrito') {
  toast('Painel exclusivo para funcionários.', 'falha');
}