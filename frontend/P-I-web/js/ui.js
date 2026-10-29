import { sessaoAtiva, sair } from './auth.js';

const MENU = [
  { id: 'inicio', texto: 'Início', href: 'inicio.html' },
  { id: 'doacao', texto: 'Nova doação', href: 'nova-doacao.html' },
  { id: 'relatorios', texto: 'Relatórios', href: 'relatorios.html' },
  { id: 'cadastro', texto: 'Novo cadastro', href: 'novo-cadastro.html' }
];

export const esc = (s) => { const d = document.createElement('div'); d.textContent = String(s ?? ''); return d.innerHTML; };

export async function navbar(ativo) {
  if (!(await sessaoAtiva())) { location.replace('login.html'); return; }
  const el = document.getElementById('navbar');
  el.className = 'navbar';
  el.innerHTML = `<a class="navbar__logo" href="inicio.html"><img src="../assets/img/logo.svg" alt="Nosso Sangue"></a>
    <nav aria-label="Principal"><ul class="navbar__menu">
    ${MENU.map((m) => `<li><a href="${m.href}"${m.id === ativo ? ' aria-current="page"' : ''}>${m.texto}</a></li>`).join('')}
    <li><a href="#" id="sair">Sair</a></li></ul></nav>`;
  document.getElementById('sair').addEventListener('click', async (e) => {
    e.preventDefault(); await sair(); location.href = 'login.html';
  });
}

let tempo;
export function toast(msg, tipo = 'sucesso') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.className = `toast toast--${tipo === 'falha' ? 'falha' : 'sucesso'}`;
  t.textContent = msg; t.hidden = false;
  clearTimeout(tempo);
  tempo = setTimeout(() => { t.hidden = true; }, 4000);
}

export function mascaraCpf(input) {
  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = v;
  });
}

export function mascaraTelefone(input) {
  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    input.value = v;
  });
}

// O backend só exige 11 dígitos; os dígitos verificadores aqui são validação extra do front.
export function cpfValido(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += cpf[i] * (t + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(cpf[t])) return false;
  }
  return true;
}
export const soDigitos = (v) => v.replace(/\D/g, '');
