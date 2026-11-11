import { entrar } from './auth.js';
import { toast } from './ui.js';

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  if (!email || !senha) return toast('Preencha email e senha', 'falha');
  try {
    await entrar(email, senha);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const apiUrl = 'http://localhost:3000/api/v1';
    const res = await fetch(`${apiUrl}/me/papel`, {
      headers: { 'Authorization': `Bearer ${data.session.access_token}` }
    });
    const papelData = await res.json();

    if (!papelData.eh_funcionario) {
      await supabase.auth.signOut();
      alert('Painel exclusivo para funcionários');
      return; 
    }

    window.location.href = 'inicio.html';
    location.href = 'inicio.html';
  } catch (err) { toast(err.message || 'Não foi possível entrar', 'falha'); }
});
