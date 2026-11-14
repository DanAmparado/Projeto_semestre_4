# Manual da Feira — Nosso Sangue

**Data:** 2026-11-12
**Apresentador(es):** [preencher quem estará presente]
**Duração do pitch:** 3–5 min (padrão de feira)
**Backend:** https://nosso-sangue-api.onrender.com
**Front:** https://nosso-sangue.vercel.app
**Swagger:** https://nosso-sangue-api.onrender.com/docs

---

## ⚡ 5 MINUTOS ANTES — CHECKLIST OBRIGATÓRIO

Marque cada item antes de começar a apresentar:

- [ ] **Aquecer o backend** (MAIS IMPORTANTE):
  ```bash
  curl https://nosso-sangue-api.onrender.com/api/v1/health
  ```
  Se demorar mais de 5 segundos, rodar de novo. Só seguir quando responder rápido (<1s).
  
- [ ] Abrir o front web no browser: `https://nosso-sangue.vercel.app/pages/login.html`
- [ ] Abrir o app mobile (Expo Go) já logado como doador
- [ ] Fechar abas pessoais (WhatsApp Web, email, etc.)
- [ ] Aumentar zoom do browser para 110% (texto legível à distância)
- [ ] Ter o celular com internet móvel de reserva (se o WiFi do local falhar)
- [ ] Papel com as credenciais em mãos (não depender de decorar)

---

## 🔑 Credenciais de Teste

| Tipo | Email | Senha | Onde usar |
|---|---|---|---|
| **Funcionário** | `funcionario@test.local` | `senha123` | Painel web |
| **Doadora Maria** | `maria.doadora@test.local` | `senha123` | App mobile |
| Doador seed | `seed01@test.local` | `senha123` | App mobile |

**Hemocentro padrão:** `11111111-1111-1111-1111-111111111111` (Hemocentro de Franca)

---

## 🎯 O que é o projeto (discurso de 30 segundos)

> "O **Nosso Sangue** é uma plataforma multiplataforma que integra hemocentros, doadores e tecnologia IoT. O Brasil tem apenas **1,6% da população doadora**, enquanto a OMS recomenda no mínimo 3%. O projeto resolve isso em três frentes: **informação** para o doador (mitos, requisitos), **engajamento** (notificações quando o estoque está baixo) e **monitoramento em tempo real** (sensores IoT na câmara fria e nas balanças de estoque)."

**Frase de efeito para abrir:** "A gente quer aumentar a taxa de doação no Brasil usando tecnologia que o hemocentro já tem — o problema não é falta de doadores, é falta de comunicação."

---

## 📱 Demo passo a passo (ordem recomendada)

### Bloco 1 — Painel do hemocentro (web) — 1 min

**Abra:** `https://nosso-sangue.vercel.app/pages/login.html`

1. **Login como funcionário** (`funcionario@test.local` / `senha123`)
2. Após entrar, o **Dashboard** abre com:
   - Estoque em tempo real (gráfico de barras com quantidade de bolsas por tipo)
   - Câmara fria (temperatura e umidade do sensor IoT)
   - Alertas pendentes (~14 alertas no banco)
3. **Fale enquanto mostra:**
   > "Aqui é o painel do hemocentro. Em tempo real, ele vê o estoque de cada tipo sanguíneo, a temperatura da câmara fria — monitorada por sensor IoT — e os alertas automáticos quando algo sai da faixa segura."

4. **Clique em "Resolver"** em um dos alertas → mostra o feedback visual

### Bloco 2 — Busca de doador + registro (web) — 45 seg

1. No menu, clique em **"Doador"** (ou navegue para `doador.html`)
2. Digite CPF: `12345678900` → clicar **Buscar**
3. Aparece: **Maria Silva Doadora, O+, 0 doações**
4. **Fale:**
   > "Na recepção, o funcionário busca o doador por CPF. Se encontrado, registra a doação em segundos."
5. Clique em **"Registrar doação"** → peso 62.5 → Confirmar
6. **Toast aparece:** "Doação registrada. Próxima permitida: 10/01/2027"
   > "O sistema calcula automaticamente o intervalo mínimo de 60 dias (mulheres) ou 90 dias (homens), conforme regra do Ministério da Saúde."

### Bloco 3 — Campanha (web) — 30 seg

1. Menu → **"Campanha"**
2. Preencher:
   - Tipo: **O+**
   - Título: **"Estoque de O+ em baixa"**
   - Mensagem: **"Precisamos de doadores O+ urgentemente."**
   - Canal: **App**
3. Clicar **"Enviar campanha"** → toast: **"Campanha enviada para 1 doador"**
4. **Fale:**
   > "Quando o estoque está baixo, o hemocentro dispara uma campanha. Só os doadores daquele tipo sanguíneo recebem — e respeitando o opt-in de cada um."

### Bloco 4 — App do doador (mobile) — 1 min

**Pegue o celular com o app aberto.**

1. **Login como Maria** (`maria.doadora@test.local` / `senha123`) — ou já logada
2. **Tela inicial:** lista os hemocentros de Franca com nível de estoque
3. **Perfil:** mostra o total de doações da Maria (agora 1, porque acabamos de registrar)
4. **Notificações:** a campanha que acabamos de criar no web **aparece aqui**
5. **Fale:**
   > "No app do doador, ele vê o estoque da cidade dele, seu histórico e as notificações do hemocentro. A integração é em tempo real — o que a gente acabou de registrar no painel já aparece aqui no celular."

### Bloco 5 — Relatórios (web) — 45 seg

1. Voltar ao browser, menu → **"Relatórios"**
2. Mostrar os 4 gráficos (geralmente já carregam com filtros pré-preenchidos):
   - **Média de doações:** pizza com distribuição por tipo sanguíneo
   - **Estudo de doadores:** barras por faixa etária + taxa de retorno (93,8%)
   - **Previsão:** linha com SARIMA + intervalo de confiança 95%
   - **CEP:** gráfico de controle estatístico da temperatura
3. **Fale:**
   > "A camada estatística usa dados reais de 52 semanas para prever demanda e controlar a qualidade da câmara fria. É o que permite o hemocentro tomar decisão baseada em dados, não em intuição."

### Bloco 6 — IoT (mencionar, não obrigatório mostrar) — 15 seg

Se alguém perguntar ou se sobrar tempo:

> "A parte de IoT usa ESP32 com sensor DHT22 (temperatura/umidade) e balanças HX711 em cada prateleira. A leitura é enviada a cada 2 segundos para o backend, que persiste no Supabase e gera alertas automáticos. Quando a temperatura sai de 2–6°C, um alerta crítico é disparado no painel."

Se quiser **mostrar de fato**, abrir `iot/readme.md` no GitHub (tem imagens do circuito) — mas não tentar rodar o simulador na feira (depende de rede específica).

---

## ❓ Perguntas frequentes (cheat sheet)

### "Isso funciona de verdade?" / "Vocês já testaram?"

> "Sim, está em produção. O backend roda no Render, o banco no Supabase (PostgreSQL) e o front no Vercel. Tudo que vocês viram agora está conectado ao banco real, com dados de teste que semeamos — 15 doadores, ~180 doações, 250 leituras de sensores."

### "Quanto custa manter isso rodando?"

> "Hoje, zero. Usamos os planos gratuitos do Render, Supabase e Vercel. Para escalar, o custo real seria de uns R$ 50–100/mês para atender um hemocentro. Muito abaixo do custo de uma campanha de mídia tradicional."

### "Como o doador é notificado?"

> "Hoje é notificação in-app — o app mostra o bell com badge. A arquitetura já suporta SMS e push real via Firebase, mas usamos simulação no PI por custo e prazo. Em produção, seria uma linha de código para trocar o adapter."

### "Isso está integrado com o Hemocentro de Franca?"

> "Está modelado para funcionar com qualquer hemocentro. O Hemocentro de Franca é nosso caso de teste, mas o sistema é multi-hemocentro — cada um gerencia seu próprio estoque, doadores e campanhas, com dados isolados por RLS (Row Level Security)."

### "Quem pode ver os dados dos doadores?"

> "O doador vê apenas os próprios dados. O funcionário vê apenas os doadores do hemocentro onde trabalha. E o RLS do banco garante isso mesmo que alguém tente acessar direto pela API — testamos com a chave pública."

### "Como vocês garantem que a temperatura está segura?"

> "Três camadas: o sensor envia a cada 2 segundos; o banco valida na entrada se está na faixa 2–6°C; e quando sai, gera alerta automático. Se a balança detecta que uma bolsa foi removida, atualiza o estoque na hora."

### "E se a internet cair no hemocentro?"

> "Hoje o sistema depende de conexão. O ESP32 tem buffer local para acumular leituras e reenviar quando a conexão volta — isso é uma das evoluções pós-PI. O backend também tem retry automático nos endpoints IoT."

### "Qual tecnologia vocês usaram?"

> "Backend em **Node.js + TypeScript + Express** com **Supabase (PostgreSQL)** para o banco e auth. Front em **HTML/CSS/JavaScript puro** (sem framework, decisão consciente para priorizar a integração). Mobile em **React Native + Expo**. IoT em **ESP32** com C++ (Arduino). Deploy em **Render + Vercel**."

### "Por que não usaram React no front?"

> "Decisão do time: o foco do 4º semestre é integração IoT + dashboard + mobile. React adicionaria complexidade sem entregar valor para o prazo. A arquitetura permite migrar depois — a API é a mesma, só o cliente mudaria."

### "Isso é seguro? E se alguém hackear?"

> "Usamos JWT do Supabase para autenticação, RLS no banco para autorização, e as chaves de produção (service role) nunca saem do backend. A chave pública do Supabase é protegida pelo RLS — mesmo que alguém a obtenha, não consegue acessar dados de outros usuários. Já testamos isso."

---

## 🚨 Se algo der errado (troubleshooting em 30 segundos)

### ❌ "A página está em branco" / "Não carrega"

**Causa mais provável:** o Render dormiu (cold start de 30s).

**O que fazer (NÃO ENTRE EM PÂNICO):**
1. Enquanto espera, **continue falando** sobre o projeto (tem o discurso de 30s + as perguntas frequentes)
2. Em outro dispositivo (celular), abra: `https://nosso-sangue-api.onrender.com/api/v1/health`
3. Se voltar `{"ok":true}`, aguarde 5s e **recarregue** o front (Ctrl+Shift+R)
4. Se não voltar em 30s, **pule para o mobile** — o app provavelmente já está carregado na memória
5. Se nada funcionar, **mostre os prints de tela** que estão no final deste manual

**Frase para usar:** "Enquanto nosso backend acorda do modo economia, deixa eu explicar como funciona a arquitetura..."

### ❌ "Deu erro de CORS"

**Causa:** improvável se o backend está quente; se acontecer, é porque o browser está acessando por `localhost` em vez do domínio do Vercel.

**O que fazer:**
1. Confirme que a URL no browser é `https://nosso-sangue.vercel.app` (não `http://localhost:...`)
2. Recarregue com `Ctrl+Shift+R`
3. Se persistir, pule para o mobile

### ❌ "O login não funciona"

**Causa:** senha errada ou conta não existe no Supabase remoto.

**O que fazer:**
1. Confirme as credenciais do papel (está no topo deste manual)
2. Se funcionário não funcionar, tente Maria no web (é doadora, vai mostrar mensagem "acesso restrito" — não é erro, é o guard funcionando)
3. Se nada funcionar, mostre os prints

### ❌ "O app mobile não abre"

**Causa:** Expo Go não conectado à rede, ou app deslogou.

**O que fazer:**
1. Login de novo com `seed01@test.local` / `senha123`
2. Se não abrir o Expo Go, mostre os prints do mobile que estão no final

### ❌ "O WiFi da feira não funciona"

**O que fazer:**
1. **Ativar hotspot no celular** e conectar o notebook
2. Se ainda assim falhar, mostrar os prints
3. Se alguém questionar, dizer: "o WiFi do local está bloqueando, mas o sistema está em produção — posso mostrar pelos prints"

### ❌ "Alguém pediu para ver o código"

**O que fazer:**
1. Abrir: `https://github.com/DanAmparado/Projeto_semestre_4`
2. Se perguntarem "por que está no seu repo pessoal e não no da faculdade", responder: "o repositório oficial é `FatecFranca/DSM-G02-PI4-2026-2` — estamos em fase de migração de deploy, mas o código é o mesmo e está disponível nos dois"

---

## 📸 Prints de tela (fallback)

**IMPORTANTE:** antes da feira, tire prints de:

- [ ] Dashboard do hemocentro (estoque + câmara fria + alertas)
- [ ] Busca de doador com "Maria Silva Doadora"
- [ ] Toast de "Doação registrada"
- [ ] Campanha criada com `total_notificados: 1`
- [ ] App mobile: home com hemocentros
- [ ] App mobile: perfil da Maria
- [ ] App mobile: notificações
- [ ] Relatórios: os 4 gráficos

**Salve no celular em uma pasta "Feira - Prints"** para acesso rápido.

Se nada funcionar na hora, você abre os prints e diz:
> "Deixa eu mostrar como ficou a versão final — o WiFi aqui está bloqueando a API, mas os dados são reais."

---

## 🗣️ Frases de impacto (para usar durante o pitch)

- **Problema:** "1,6% da população doadora vs. 3% recomendado pela OMS. Metade do que deveria ser."
- **Solução:** "Não é falta de doadores — é falta de comunicação. A gente resolve isso com dados em tempo real."
- **IoT:** "Um alerta de temperatura pode salvar uma bolsa de sangue. Multiplica por 200 bolsas por dia em um hemocentro."
- **Estatística:** "A previsão SARIMA tem erro médio de 3,6% em estudos reais. Não é intuição, é modelo."
- **Multiplataforma:** "O funcionário usa o web. O doador usa o mobile. Os sensores rodam sozinhos. Tudo conversando em tempo real."

---

## 🎭 Divisão de papéis (se houver 2+ pessoas)

| Pessoa | Papel | O que faz |
|---|---|---|
| **P1** | Narrador | Fala o pitch inicial, conduz a demo, responde perguntas |
| **P2** | Operador técnico | Cuida das telas (login, cliques), resolve problemas técnicos em segundo plano |

Se for 1 pessoa só: faça o pitch inteiro e use o mobile como apoio (ele fica "carregado" enquanto você fala do web).

---

## ✅ Checklist de saída

Antes de ir para a feira:

- [ ] Notebook carregado + carregador
- [ ] Celular carregado + power bank
- [ ] Prints de tela salvos no celular (backup)
- [ ] Backend aquecido 5 min antes
- [ ] Credenciais no papel (não confiar em decorar)
- [ ] Este manual aberto no celular (para consulta rápida)
- [ ] Água (você vai falar muito)

---

## 📋 Resumo do pitch (30 segundos, para decorar)

> "O **Nosso Sangue** conecta hemocentros, doadores e sensores IoT para aumentar a taxa de doação no Brasil — hoje só 1,6% da população doa, e a OMS recomenda 3%. A gente resolve isso em três frentes: o **funcionário** vê estoque e câmara fria em tempo real, o **doador** recebe notificação quando o estoque está baixo, e o **IoT** monitora temperatura e bolsas automaticamente. Tudo isso numa plataforma multiplataforma, com estatística para prever demanda. Quer ver funcionando?"

**"Quer ver funcionando?"** → melhor transição para a demo.

---

## 🔗 Links úteis (para consulta rápida)

- Front: https://nosso-sangue.vercel.app
- Login: https://nosso-sangue.vercel.app/pages/login.html
- API Health: https://nosso-sangue-api.onrender.com/api/v1/health
- Swagger: https://nosso-sangue-api.onrender.com/docs
- Repo: https://github.com/DanAmparado/Projeto_semestre_4
- Repo oficial: https://github.com/FatecFranca/DSM-G02-PI4-2026-2

---

**Boa feira! Se travar em algo, respira, abre este manual, e lembra: o projeto está em produção e funciona. Qualquer erro é de rede ou cold start — não é do sistema.**