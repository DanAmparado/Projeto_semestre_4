# Status do Projeto — Backend em produção + pendências do front

**Data:** 2026-11-03
**Backend em produção:** https://nosso-sangue-api.onrender.com/api/v1
**Contrato da API:** `docs/api/openapi.yaml` v1.9.0
**Branch alvo do merge:** `Guilherme.H-front` → `main`

---

## ✅ O que está pronto e estável

- **Backend em produção**: `https://nosso-sangue-api.onrender.com/api/v1`
- **Banco**: Supabase remoto (São Paulo) com 19 migrations, seeds e dados de demo (15 doadores, ~180 doações, 250 leituras)
- **28 endpoints** implementados e testados: auth, doadores, doações, estoque, IoT, alertas, campanhas, relatórios, dashboard
- **Contrato documentado**: `docs/api/openapi.yaml` v1.9.0 (sem pendências)
- **Front web**: login, dashboard, estoque, alertas e relatórios já consumindo o backend real (branch `Guilherme.H-front` commitada)
- **Config de produção**: `USAR_MOCK=false` no web, `.env.example` no mobile

---

## ⏳ O que falta para fechar o merge `Guilherme.H-front` → `main`

São 4 tarefas do front. Cada uma tem contrato de API já pronto — só implementar UI.

---

## 🔴 TAREFA 1 — Mobile não roda (sem `package.json`)

**Bloqueia:** deploy mobile + gravação da parte mobile do vídeo

**Arquivo:** `frontend/p-i mobile ofc/package.json`

**O que fazer:**

1. Verificar se o arquivo existe localmente (`ls "frontend/p-i mobile ofc/"`)
2. Se existir mas não foi commitado, adicionar e commitar junto com `package-lock.json`
3. Se não existir, criar (Expo Router base):

```json
{
  "name": "nosso-sangue-mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.1.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@supabase/supabase-js": "^2.45.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.12",
    "typescript": "^5.6.0"
  }
}
```

**Teste:** `cd "frontend/p-i mobile ofc" && npm install && npx expo start` → Metro Bundler abre, tecla `w` roda web em `http://localhost:8081`.

---

## 🔴 TAREFA 2 — Página de busca de doador (não existe)

**Bloqueia:** fluxo "funcionário busca doador na recepção e registra doação"

**Arquivos:**
- `frontend/P-I-web/pages/doador.html` (novo)
- `frontend/P-I-web/js/doador.js` (novo)
- Link no menu/dashboard

**Comportamento:**

1. Input CPF (11 dígitos) + botão "Buscar"
2. Ao buscar:

   ```js
   const doador = await apiFetch(`/hemocentros/${HEMOCENTRO_ID}/doadores?cpf=${cpf}`);
   ```

   - **404** → mensagem "Doador não encontrado. Peça para se cadastrar pelo app."
   - **200** → card com nome, tipo sanguíneo (badge), total de doações, última doação (ou "Nunca doou") e botão **"Registrar doação"**

3. Ao clicar em "Registrar doação":
   - Modal com input peso (opcional) e observação (opcional)
   - Confirmar:

     ```js
     const res = await apiFetch(`/hemocentros/${HEMOCENTRO_ID}/doacoes`, {
       method: 'POST',
       body: JSON.stringify({
         usuario_id: doador.id,
         tipo_sanguineo: doador.tipo_sanguineo,
         peso: pesoOuNull,
         observacao: obsOuNull
       })
     });
     ```

   - Toast: "Doação registrada. Próxima permitida: {res.proxima_doacao_permitida}"

**Contrato:**

```
GET /api/v1/hemocentros/:id/doadores?cpf=12345678900
→ 200: { id, nome_completo, tipo_sanguineo, total_doacoes, ultima_doacao }
→ 404: { erro: { codigo: "NAO_ENCONTRADO" } }

POST /api/v1/hemocentros/:id/doacoes
Body: { usuario_id, tipo_sanguineo, peso?, observacao? }
→ 201: { id, data_doacao, proxima_doacao_permitida, movimentacao_id }
```

**Teste:** CPF `12345678900` (Maria Silva Doadora, O+, 0 doações) → buscar → registrar doação → `total_doacoes` vira 1.

---

## 🔴 TAREFA 3 — Página de criar campanha (não existe)

**Bloqueia:** funcionalidade central da proposta ("hemocentro notifica doadores em baixa")

**Arquivos:**
- `frontend/P-I-web/pages/campanha.html` (novo)
- `frontend/P-I-web/js/campanha.js` (novo)
- Link no menu

**Comportamento:**

1. Formulário:
   - Select `tipo_sanguineo` (8 opções: A+, A-, B+, B-, AB+, AB-, O+, O-)
   - Input `titulo` (max 100)
   - Textarea `mensagem` (max 500)
   - Select `canal`: App / SMS / Email / Push (default "app")
   - Botão "Enviar campanha"

2. Ao enviar:

   ```js
   const res = await apiFetch(`/hemocentros/${HEMOCENTRO_ID}/campanhas`, {
     method: 'POST',
     body: JSON.stringify({ tipo_sanguineo, titulo, mensagem, canal })
   });
   ```

3. Toast: "Campanha enviada para {res.total_notificados} doador(es)"

**Contrato:**

```
POST /api/v1/hemocentros/:id/campanhas
Body: { tipo_sanguineo, titulo, mensagem, canal? }
→ 201: { id, tipo_sanguineo, titulo, canal, total_notificados }
```

**Teste:** criar campanha O+, canal app → `total_notificados: 1` (só a Maria recebe). Logar como Maria no mobile → ver a notificação.

---

## 🟡 TAREFA 4 — Gráficos nos relatórios

**Impacto:** manual de Estatística exige "gráficos e indicadores". Tabela só perde ponto.

**Arquivo:** adicionar `<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>` no `<head>` de `relatorios.html`.

**Gráficos por relatório:**

### A) Média de doações

`GET /relatorios/media-doacoes?inicio=&fim=`

- **Pizza (doughnut)** da `distribuicao` (tipo sanguíneo × quantidade)
- KPIs em cards acima: `total_doacoes`, `media_diaria`, `doadores_unicos`

### B) Estudo de doadores

`GET /relatorios/estudo-doadores?inicio=&fim=`

- **Barras agrupadas** das `faixas_etarias` (2 séries: `total` e `retornaram`)
- KPIs em cards acima

### C) Previsão de demanda

`GET /relatorios/previsao?tipo_sanguineo=O%2B&semanas=52&horizonte=4`

- **Linha** com 3 séries: `demanda_prevista` (sólida), `limite_superior_95` e `limite_inferior_95` (tracejadas)
- Preencher a área entre os limites com transparência

### D) CEP (Controle Estatístico)

`GET /relatorios/cep?sensor_id=...&inicio=&fim=`

- **Linha de pontos** de temperatura com cor por `status_ponto`:
  - `normal` → verde
  - `fora_controle` → amarelo
  - `fora_especificacao` → vermelho
- 3 linhas horizontais de referência: `media_global` (sólida), `limite_controle_superior` e `limite_controle_inferior` (tracejadas)

**Manter a tabela abaixo de cada gráfico.** Só adicionar, não remover.

**Teste:** abrir `relatorios.html`, aplicar filtros, ver os 4 gráficos renderizados.

---

## 🟢 BÔNUS — Filtros pré-preenchidos nos relatórios

Para a demo ficar fluida, sem o usuário digitar 4 campos antes de ver algo:

- **Média de doações:** `inicio = hoje - 30d`, `fim = hoje`
- **Estudo de doadores:** `inicio = hoje - 365d`, `fim = hoje`
- **Previsão:** `tipo_sanguineo = O+`, `semanas = 52`, `horizonte = 4`
- **CEP:** `sensor_id = '9d2b0375-7755-44fc-ad8a-9dcaa93bc71f'`, `inicio = hoje - 30d`, `fim = hoje`

Calcular no JS com `new Date()`, formatar `YYYY-MM-DD`.

---

## 📌 Ordem sugerida

| Ordem | Tarefa | Estimativa |
|---|---|---|
| 1 | Mobile `package.json` (Tarefa 1) | 15 min |
| 2 | Busca de doador (Tarefa 2) | 2–3h |
| 3 | Criar campanha (Tarefa 3) | 1–2h |
| 4 | Gráficos (Tarefa 4) | 3–4h |
| 5 | Filtros pré-preenchidos (Bônus) | 30 min |

**Total estimado:** ~1 dia de trabalho.

**Depois disso:** rodada de testes integrados, PR, merge e deploy no Vercel.

---

## 🔑 Credenciais de teste

| Tipo | Email | Senha | Notas |
|---|---|---|---|
| Funcionário | `funcionario@test.local` | `senha123` | admin do Hemocentro Franca |
| Maria (doadora) | `maria.doadora@test.local` | `senha123` | O+, 0 doações (usar para testar registro) |
| Doadores do seed | `seed01..15@test.local` | `senha123` | 8 tipos sanguíneos, várias doações |

---

## ⚠️ Notas importantes

- **Windows + IPv6:** acessar o front via `http://127.0.0.1:5500` (não `localhost`). O browser resolve `localhost` para IPv6 (`[::1]`) e o CORS do backend bloqueia. Já documentado no `README` do front.
- **CORS do Render:** se servir o front em outra porta, avisar para atualizar `CORS_ORIGIN` no painel do Render.
- **Publishable key** (`sb_publishable_...`) é pública por design — pode estar no JS do front. **Secret key** (`sb_secret_...`) só no backend (Render), nunca no repo.
- **Cold start do Render:** free tier dorme após 15 min inativo. Primeira request demora ~30s. Aquecer com `curl https://nosso-sangue-api.onrender.com/api/v1/health` antes de testar no browser.

---

## 📚 Referências

- Contrato completo: `docs/api/openapi.yaml` v1.9.0
- Como rodar localmente: `backend/README.md`
- Criar usuários de teste: `docs/dev/funcionario-teste.md`
- Guia de migração do front: `docs/api/migracao-front.md`
- Fluxo de autenticação: `docs/api/auth-flow.md`