# Tarefas — Frontend Web + Mobile

**Data:** 2026-11-10
**Responsável:** Guilherme / Daniel
**Contexto geral:** web é só para funcionário, mobile é só para doador. Hoje o web não bloqueia doador e o mobile tem tela branca quando o backend hiberna.

## Prioridades

- **P0:** bloqueia experiência na demo
- **P1:** necessário antes da entrega
- **P2:** polimento

## Resumo Web

| # | Tarefa | Prioridade | Tempo | Depende de |
|---|---|---|---|---|
| 1 | `guardFuncionario()` em `ui.js` | P1 | 5 min | Backend #1 |
| 2 | `login.js` chama `/me/papel` | P1 | 10 min | Backend #1, #1 |
| 3 | Guard em `inicio`, `doador`, `campanha`, `relatorios` | P1 | 10 min | #1 |
| 4 | Remover link "Criar conta" do `login.html` | P1 | 2 min | — |
| 5 | `doador.js`: botão "Criar conta" no 404 | P1 | 10 min | #3, Backend #2 |
| 6 | Reescrever `novo-cadastro` (HTML + JS) | P1 | 20 min | Backend #2, #1 |
| 7 | `reset-password.html` + `reset-password.js` | P1 | 30 min | DevOps #3 |
| 8 | Botão "Esqueci senha" no `login.html` (opcional) | P2 | 5 min | #7 |

## Resumo Mobile

| # | Tarefa | Prioridade | Tempo | Depende de |
|---|---|---|---|---|
| 9 | Timeout no `apiFetch` | **P0** | 5 min | — |
| 10 | `AuthContext`: `error` + `refetch` | **P0** | 10 min | — |
| 11 | `PerfilScreen`: 3 estados | **P0** | 15 min | #10 |
| 12 | `app/index.tsx`: usar `loading` | **P0** | 5 min | #10 |
| 13 | Logout no `Header` (todas as telas) | P1 | 10 min | #12 |
| 14 | Botão "Esqueci senha" no `login.tsx` | P1 | 10 min | #7, DevOps #3 |
| 15 | `AppState`: `refreshSession` ao voltar | P2 | 10 min | DevOps #2 |

---

# 🌐 WEB

## 1. `guardFuncionario()` em `ui.js` — P1

**`frontend/P-I-web/js/ui.js`** (adicionar):

```js
import { supabase } from './supabase.js';
import { apiFetch } from './http.js';

export async function guardFuncionario() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    location.href = 'login.html';
    return false;
  }
  try {
    const papel = await apiFetch('/me/papel');
    if (!papel.eh_funcionario) {
      await supabase.auth.signOut();
      location.href = 'login.html?erro=acesso-restrito';
      return false;
    }
    return true;
  } catch {
    location.href = 'login.html';
    return false;
  }
}
```

---

## 2. `login.js` chama `/me/papel` pós-login — P1

**`frontend/P-I-web/js/login.js`** — substituir inteiro:

```js
import { entrar } from './auth.js';
import { toast } from './ui.js';
import { supabase } from './supabase.js';
import { apiFetch } from './http.js';

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  if (!email || !senha) return toast('Preencha email e senha', 'falha');

  try {
    await entrar(email, senha);

    const papel = await apiFetch('/me/papel');
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

// Mensagem se chegou via redirect de acesso restrito
const params = new URLSearchParams(location.search);
if (params.get('erro') === 'acesso-restrito') {
  toast('Painel exclusivo para funcionários.', 'falha');
}
```

---

## 3. Guard em todas as páginas de funcionário — P1

**`frontend/P-I-web/js/inicio.js`**, **`doador.js`**, **`campanha.js`**, **`relatorios.js`** — no **topo**, antes de qualquer coisa:

```js
import { guardFuncionario } from './ui.js';
if (!(await guardFuncionario())) throw new Error('acesso negado');
```

Substituir o `await navbar('inicio')` (ou similar) por:

```js
import { navbar, guardFuncionario } from './ui.js';
if (!(await guardFuncionario())) throw new Error('acesso negado');
await navbar('inicio');
```

**Exceção:** `novo-cadastro.js` também precisa de guard, mas depende da reescrita (tarefa #6).

---

## 4. Remover link "Criar conta" do `login.html` — P1

**`frontend/P-I-web/pages/login.html`** — remover o `<a>` ou `<button>` que aponta para `novo-cadastro.html`.

O link vai para a página de busca de doador (`doador.html`), no fluxo pós-login.

---

## 5. `doador.js`: botão "Criar conta" no 404 — P1

**`frontend/P-I-web/js/doador.js`** — no catch de erro da busca, quando `err.codigo === 'NAO_ENCONTRADO'` ou mensagem similar:

```js
catch (err) {
  if (err.message?.includes('não encontrado')) {
    resultado.innerHTML = `
      <div class="doador-vazio">
        <p>Doador não encontrado.</p>
        <a class="btn btn--verde" href="novo-cadastro.html?cpf=${cpf}">
          Criar conta para este doador
        </a>
      </div>
    `;
  } else {
    toast(err.message, 'falha');
  }
}
```

---

## 6. Reescrever `novo-cadastro` (HTML + JS) — P1

### `frontend/P-I-web/pages/novo-cadastro.html` — remover senha

Remover as duas `<div class="campo">` de **senha** e **confirma** (linhas ~26–27 do arquivo atual). Não são mais preenchidas pelo funcionário.

Adicionar um `<div id="sucesso-modal"></div>` no fim do `<main>` para o modal.

### `frontend/P-I-web/js/novo-cadastro.js` — substituir inteiro

```js
import { navbar, toast, mascaraCpf, mascaraTelefone, cpfValido, soDigitos, guardFuncionario } from './ui.js';
import { apiFetch } from './http.js';
import { HEMOCENTRO_ID } from './config.js';

if (!(await guardFuncionario())) throw new Error('acesso negado');
await navbar('cadastro');

const $ = (id) => document.getElementById(id);
mascaraCpf($('cpf'));
mascaraTelefone($('tel'));

// Prefill do CPF se veio via ?cpf= da busca de doador
const params = new URLSearchParams(location.search);
const cpfPrefill = params.get('cpf');
if (cpfPrefill) {
  $('cpf').value = cpfPrefill;
  $('nome').focus();
}

$('form-cadastro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = (id) => $(id).value.trim();

  if (['nome', 'cpf', 'nasc', 'sexo', 'tipo', 'tel', 'peso', 'email'].some((id) => !v(id))) {
    return toast('Preencha todos os campos', 'falha');
  }
  if (!cpfValido(v('cpf'))) return toast('CPF inválido', 'falha');

  try {
    const res = await apiFetch(`/hemocentros/${HEMOCENTRO_ID}/doadores`, {
      method: 'POST',
      body: JSON.stringify({
        nome_completo: v('nome'),
        cpf: soDigitos(v('cpf')),
        data_nascimento: v('nasc'),
        sexo: v('sexo'),
        tipo_sanguineo: v('tipo'),
        telefone: v('tel'),
        email: v('email'),
        peso: +v('peso'),
      }),
    });

    mostrarModalSucesso(res.email, res.senha_temporaria);
    $('form-cadastro').reset();
  } catch (err) {
    toast(err.message || 'Falha no cadastro', 'falha');
  }
});

function mostrarModalSucesso(email, senha) {
  const modal = document.getElementById('sucesso-modal');
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <h2>Conta criada</h2>
        <p>Informe ao doador:</p>
        <div class="credencial">
          <label>Email</label>
          <code>${email}</code>
        </div>
        <div class="credencial">
          <label>Senha temporária</label>
          <code>${senha}</code>
          <button type="button" onclick="navigator.clipboard.writeText('${senha}'); this.textContent='Copiado!';">
            Copiar
          </button>
        </div>
        <p class="aviso">O doador deve usar essa senha para entrar no app.</p>
        <div class="acoes">
          <button type="button" onclick="document.getElementById('sucesso-modal').innerHTML=''">
            Próximo doador
          </button>
          <button type="button" onclick="location.href='inicio.html'">
            Concluir
          </button>
        </div>
      </div>
    </div>
  `;
}
```

Adicionar CSS do modal em `pages.css`:

```css
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal {
  background: #fff; border-radius: 16px; padding: 24px; max-width: 420px; width: 90%;
}
.modal h2 { margin-bottom: 12px; }
.credencial {
  background: #f5f5f5; border-radius: 8px; padding: 12px; margin: 12px 0;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.credencial label { font-size: 12px; color: #666; width: 100%; }
.credencial code { font-size: 16px; font-weight: 700; flex: 1; }
.credencial button { padding: 6px 12px; border-radius: 6px; border: 0; cursor: pointer; }
.aviso { font-size: 13px; color: #666; margin: 12px 0; }
.acoes { display: flex; gap: 8px; justify-content: flex-end; }
.acoes button { padding: 10px 16px; border-radius: 8px; border: 0; cursor: pointer; }
```

---

## 7. `reset-password.html` + `reset-password.js` — P1

### `frontend/P-I-web/pages/reset-password.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redefinir senha | Nosso Sangue</title>
  <link rel="stylesheet" href="../css/base.css">
  <link rel="stylesheet" href="../css/components.css">
  <link rel="stylesheet" href="../css/pages.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body class="login">
  <main>
    <form class="login__form" id="form-reset" novalidate>
      <img src="../assets/img/logo.svg" alt="">
      <p class="login__marca">Nosso Sangue</p>
      <p>Defina sua nova senha</p>
      <div class="campo"><label for="nova">Nova senha</label>
        <input id="nova" type="password" minlength="6" required></div>
      <div class="campo"><label for="confirma">Confirme a senha</label>
        <input id="confirma" type="password" required></div>
      <button class="btn" type="submit">Salvar nova senha</button>
    </form>
  </main>
  <script type="module" src="../js/reset-password.js"></script>
</body>
</html>
```

### `frontend/P-I-web/js/reset-password.js`

```js
import { supabase } from './supabase.js';
import { toast } from './ui.js';

// Supabase manda o token no hash da URL (#access_token=...&type=recovery)
// O supabase-js processa automaticamente se `detectSessionInUrl` estiver ativo.

const { data: { session }, error } = await supabase.auth.getSession();

if (error || !session) {
  toast('Link expirado ou inválido. Solicite um novo.', 'falha');
  setTimeout(() => { location.href = 'login.html'; }, 3000);
}

document.getElementById('form-reset').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nova = document.getElementById('nova').value;
  const confirma = document.getElementById('confirma').value;

  if (nova.length < 6) return toast('Senha muito curta (mínimo 6)', 'falha');
  if (nova !== confirma) return toast('As senhas não coincidem', 'falha');

  const { error: updError } = await supabase.auth.updateUser({ password: nova });

  if (updError) {
    toast(updError.message, 'falha');
    return;
  }

  toast('Senha alterada com sucesso!');
  await supabase.auth.signOut();
  setTimeout(() => { location.href = 'login.html'; }, 2000);
});
```

**Importante:** o `supabase.js` precisa ter `detectSessionInUrl: true` (que é o default). Verificar.

---

## 8. Botão "Esqueci senha" no `login.html` — P2 (opcional)

Se quiser permitir reset para funcionários também, adicionar em `login.html`:

```html
<a href="#" id="link-recuperar" style="display:block; text-align:center; margin-top: 12px; font-size: 13px;">
  Esqueci minha senha
</a>
```

E em `login.js`:

```js
document.getElementById('link-recuperar')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  if (!email) return toast('Preencha o email primeiro', 'falha');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://nosso-sangue.vercel.app/pages/reset-password.html',
  });

  if (error) return toast(error.message, 'falha');
  toast('Verifique seu email para redefinir a senha.');
});
```

---

# 📱 MOBILE

## 9. Timeout no `apiFetch` — **P0**

**`frontend/p-i mobile ofc/services/http.ts`** — substituir inteiro:

```ts
import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const TIMEOUT_MS = 15000;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...((options.headers as Record<string, string>) ?? {}),
      },
    });

    clearTimeout(timeoutId);

    if (res.status === 204) return null as T;

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = body?.erro?.mensagem ?? `Erro ${res.status}`;
      throw new Error(msg);
    }

    return body as T;
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error('Servidor demorou para responder. Verifique sua conexão.');
    }
    throw e;
  }
}
```

---

## 10. `AuthContext`: expor `error` + `refetch` — **P0**

Substituir **o arquivo inteiro** pelo conteúdo já entregue na conversa (`error` no state, `refetch` no contexto, `.catch` do `loadProfile` que chama `setError`).

---

## 11. `PerfilScreen`: 3 estados — **P0**

Substituir o início do componente:

```tsx
export default function PerfilScreen() {
  const { user, loading, error, refetch, signOut } = useAuth();

  if (loading) {
    return (
      <Screen title="PERFIL">
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
          <Text style={styles.hintText}>Se demorar, o servidor pode estar acordando.</Text>
        </View>
      </Screen>
    );
  }

  if (error || !user) {
    return (
      <Screen title="PERFIL">
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>Não foi possível carregar</Text>
          <Text style={styles.errorMsg}>{error || 'Perfil indisponível'}</Text>
          <Button size="sm" label="TENTAR NOVAMENTE" onPress={refetch} />
          <Pressable
            onPress={async () => { await signOut(); router.replace('/welcome'); }}
            style={{ marginTop: 24 }}
          >
            <Text style={{ color: colors.primary, fontWeight: '800' }}>SAIR DA CONTA</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="PERFIL">
      {/* conteúdo atual */}
    </Screen>
  );
}
```

Adicionar `ActivityIndicator` no import do `react-native`, e os styles:

```ts
centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, minHeight: 300 },
loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
hintText: { marginTop: 8, color: '#999', fontSize: 12, textAlign: 'center' },
errorTitle: { fontSize: 16, color: colors.primary, fontWeight: '700', marginBottom: 8 },
errorMsg: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 16 },
```

---

## 12. `app/index.tsx`: usar `loading` do contexto — **P0**

```tsx
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#B01F2E" />
      </View>
    );
  }

  return <Redirect href={user ? '/home' : '/welcome'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
```

---

## 13. Logout no `Header` — P1

**`frontend/p-i mobile ofc/components/Header.tsx`** — adicionar à direita do logo:

```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

// dentro do Header:
const { signOut } = useAuth();

const confirmarLogout = () => {
  Alert.alert('Sair da conta?', 'Você precisará fazer login novamente.', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Sair',
      style: 'destructive',
      onPress: async () => {
        await signOut();
        router.replace('/welcome');
      },
    },
  ]);
};

// no JSX, à direita:
<Pressable onPress={confirmarLogout} hitSlop={12}>
  <MaterialCommunityIcons name="logout" size={22} color="#fff" />
</Pressable>
```

E remover o `Pressable` "SAIR DA CONTA" do `PerfilScreen.tsx` (fica só no header).

---

## 14. Botão "Esqueci senha" no `login.tsx` — P1

Adicionar abaixo do botão "Entrar":

```tsx
<TouchableOpacity onPress={recuperarSenha}>
  <Text style={styles.link}>Esqueci minha senha</Text>
</TouchableOpacity>
```

E a função:

```tsx
async function recuperarSenha() {
  if (!email) {
    Alert.alert('Preencha o email primeiro', 'Digite seu email no campo acima.');
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://nosso-sangue.vercel.app/pages/reset-password.html',
  });

  if (error) {
    Alert.alert('Erro', error.message);
    return;
  }

  Alert.alert(
    'Verifique seu e-mail',
    'Enviamos um link para redefinir sua senha. Abra no navegador para continuar.',
  );
}
```

---

## 15. `AppState`: `refreshSession` ao voltar do background — P2

**`frontend/p-i mobile ofc/context/AuthContext.tsx`** — adicionar:

```tsx
import { AppState } from 'react-native';

useEffect(() => {
  const sub = AppState.addEventListener('change', async (state) => {
    if (state === 'active') {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.refreshSession();
      }
    }
  });
  return () => sub.remove();
}, []);
```

Isso resolve a expiração após horas em background (refresh token reuse).

---

## Ordem de execução

| # | Tarefa | Prioridade | Depende de |
|---|---|---|---|
| 1 | Timeout `apiFetch` | **P0** | — |
| 2 | `AuthContext` error + refetch | **P0** | — |
| 3 | `PerfilScreen` 3 estados | **P0** | #2 |
| 4 | `app/index.tsx` | **P0** | #2 |
| 5 | `guardFuncionario` | P1 | Backend #1 |
| 6 | `login.js` com `/me/papel` | P1 | Backend #1, #5 |
| 7 | Guard em todas as páginas | P1 | #5 |
| 8 | Remover link "Criar conta" do login | P1 | — |
| 9 | `doador.js` botão criar conta | P1 | #5, #7, Backend #2 |
| 10 | Reescrever `novo-cadastro` | P1 | Backend #2, #5 |
| 11 | `reset-password.html` + JS | P1 | — |
| 12 | Botão "Esqueci senha" mobile | P1 | #11, DevOps #3 |
| 13 | Logout no Header | P1 | #2 |
| 14 | Remover "SAIR" do Perfil | P1 | #13 |
| 15 | Botão "Esqueci senha" web (opcional) | P2 | #11, DevOps #3 |
| 16 | `AppState` refreshSession | P2 | — |

## Checklist de teste

### Web
- [ ] Doador logando no web → toast "acesso restrito", permanece em login
- [ ] Funcionário logando no web → entra, dashboard funciona
- [ ] Funcionário criando doador via `doador.html` 404 → modal com senha temporária
- [ ] Doador criado consegue logar no mobile com a senha temporária
- [ ] Reset password: pedir email → receber link → definir nova senha → logar
- [ ] `inicio.html` com URL direta sem login → redirect para login

### Mobile
- [ ] Primeira abertura com backend dormindo → "Carregando..." → 15s → erro + retry
- [ ] Backend acordado → perfil carrega em <1s
- [ ] Logout no header funciona em qualquer tela
- [ ] Sem internet → erro com retry acessível
- [ ] Reset password: botão no login → receber email → link abre `reset-password.html` → nova senha → logar

## Commits sugeridos

```bash
git add "frontend/P-I-web/"
git commit -F - <<'EOF'
feat(web): bloqueia doador no painel e reescreve fluxo de cadastro

- guardFuncionario() em ui.js
- login.js chama /me/papel e desloga doador
- guard em inicio/doador/campanha/relatorios
- doador.js: botão "Criar conta" no 404
- novo-cadastro: usa POST /hemocentros/:id/doadores + modal com senha
- reset-password.html + reset-password.js
EOF

git add "frontend/p-i mobile ofc/"
git commit -F - <<'EOF'
fix(mobile): timeout, loading state, retry e logout acessível

- apiFetch: AbortController com 15s
- AuthContext: error + refetch
- PerfilScreen: 3 estados (loading/erro/ok)
- app/index.tsx: usa loading do contexto
- Header: ícone de logout
- login.tsx: botão "Esqueci minha senha"
- AppState: refreshSession ao voltar do background
EOF
```