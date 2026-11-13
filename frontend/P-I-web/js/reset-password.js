import { navbar } from './ui.js';
import { supabase } from './supabase.js'; // <-- Puxando direto da fonte correta

// 1. Carrega a Navbar primeiro (passando 'login' para não bugar o menu)
await navbar('login'); 

// 2. Lógica do formulário de redefinir senha
document.addEventListener('DOMContentLoaded', () => {
  const formReset = document.getElementById('form-reset');

  if (formReset) {
    formReset.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const novaSenha = document.getElementById('nova-senha').value;
      const btnSubmit = e.target.querySelector('button[type="submit"]');

      // Bloqueia o botão para evitar múltiplos cliques
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Atualizando...';

      // Atualiza a senha no Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) {
        alert('Erro ao atualizar senha: ' + error.message);
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Atualizar Senha';
      } else {
        alert('Senha atualizada com sucesso! Você já pode fazer login no app.');
        window.location.replace('login.html'); 
      }
    });
  }
});