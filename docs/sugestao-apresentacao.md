# Roteiro do vídeo de demonstração (5 min)

**Exigência do manual:** máximo de 5 minutos, todos os membros do grupo devem ter fala, foco na demonstração prática do software. Podem ser usados slides para contextualizar, mas o foco é o software rodando.

**URLs de demo:**
- Backend API: https://nosso-sangue-api.onrender.com/docs
- Front web: (a ser preenchido após deploy no Vercel)
- Mobile: (gravar localmente com Expo Go ou deploy)

**Antes de gravar — checklist de preparação:**

1. Aquecer o Render 2 min antes: `curl https://nosso-sangue-api.onrender.com/api/v1/health`
2. Rodar `./backend/scripts/smoke-test.sh` para confirmar tudo verde
3. Fechar abas/notificações do navegador que possam distrair
4. Aumentar zoom do navegador para 110–125% (texto legível no vídeo)
5. Gravar em tela cheia, sem mostrar abas, menu do VS Code, ou janelas pessoais
6. Ter os dados de demo prontos:
   - Login funcionário: `funcionario@test.local` / `senha123`
   - Doadora Maria: CPF `12345678900`
   - Alertas pendentes no sistema (não resolver todos antes)

---

## Bloco 1 — Contextualização (0:00–0:30) — [Integrante 1]

**Fala:**
> "Nosso projeto é o **Nosso Sangue**, uma plataforma que integra hemocentros, doadores e tecnologia IoT para aumentar a taxa de doação de sangue no Brasil. Hoje o país tem 1,6% da população doadora, enquanto a OMS recomenda pelo menos 3%. O objetivo é aproximar o doador do hemocentro com informação, engajamento e dados em tempo real."

**Tela:** slide único com o problema (1,6% vs 3%) e o nome do projeto. Ou o Swagger do backend aberto mostrando os 28 endpoints (já é impacto).

---

## Bloco 2 — Arquitetura (0:30–1:00) — [Integrante 2]

**Fala:**
> "A arquitetura é multiplataforma. O backend é uma API REST em Node.js + TypeScript no Render, conectada a um banco PostgreSQL no Supabase com Row Level Security. O front web é React consumido no Vercel. O app mobile é React Native com Expo. Os sensores IoT são ESP32 enviando leituras via HTTP. Temos 28 endpoints cobrindo autenticação, doadores, doações, estoque, alertas, campanhas, IoT e relatórios estatísticos."

**Tela:** diagrama de arquitetura (de `docs/arquitetura.md`) ou Swagger com os endpoints agrupados por tag.

**Ação ao vivo:** abrir `https://nosso-sangue-api.onrender.com/docs`, mostrar rapidamente os grupos.

---

## Bloco 3 — Dashboard e IoT (1:00–2:15) — [Integrante 3]

**Fala:**
> "O dashboard do hemocentro mostra o estado atual em tempo real: estoque de cada tipo sanguíneo, alertas pendentes, câmara fria monitorada por sensores."

**Ações ao vivo:**
1. Login como funcionário
2. Mostrar dashboard: KPIs, estoque de 8 tipos
3. Clicar em "Câmara Fria" → mostrar leitura mais recente (temperatura ~4°C, umidade)
4. Mostrar alertas pendentes (estoque crítico de B-, AB-, O- e alertas de temperatura)
5. Resolver um alerta (botão "Resolver") — mostrar feedback

**Fala de fechamento do bloco:**
> "Os sensores ESP32 enviam leituras a cada 30 segundos. Quando a temperatura sai da faixa segura (2 a 6°C), o sistema dispara alerta automaticamente — isso protege as bolsas de sangue, que perdem validade se ficarem expostas a temperatura inadequada."

---

## Bloco 4 — Fluxo do doador e campanha (2:15–3:30) — [Integrante 4]

**Fala:**
> "O fluxo do hemocentro é completo: busca do doador por CPF, registro de doação, e notificação de doadores quando o estoque está em baixa."

**Ações ao vivo:**
1. Ir em "Doador" → buscar CPF `12345678900`
2. Mostrar card da Maria: O+, 0 doações, "Nunca doou"
3. Clicar "Registrar doação" → peso 62.5 → confirmar
4. Toast: "Doação registrada. Próxima permitida: 02/01/2027" (~60 dias)
5. Voltar em "Doador" → buscar Maria de novo → mostrar `total_doacoes: 1`
6. Ir em "Campanha" → criar campanha:
   - Tipo sanguíneo: O+
   - Título: "Estoque de O+ em baixa"
   - Mensagem: "Estamos precisando de doadores O+. Agende sua doação."
   - Canal: App
7. Toast: "Campanha enviada para 1 doador" (só a Maria)

**Fala de fechamento:**
> "Isso fecha o ciclo: o hemocentro vê o estoque baixo, cria uma campanha, e o doador recebe a notificação direto no app."

---

## Bloco 5 — Mobile (3:30–4:15) — [Integrante 3 ou 4]

**Fala:**
> "No aplicativo mobile, o doador consulta o nível de sangue da cidade dele, o próprio histórico, e recebe as notificações do hemocentro."

**Ações ao vivo (Expo Go ou Expo Web):**
1. Login como Maria (`maria.doadora@test.local` / `senha123`)
2. Home: hemocentros da cidade com nível de estoque
3. Perfil: tipo O+, `total_doacoes: 1`, `pontos: 10`, próxima doação permitida
4. Notificações: mostrar a campanha que acabou de ser criada no bloco 4
5. Histórico: a doação registrada agora aparece

**Fala de fechamento:**
> "A integração é completa: o que foi registrado no painel do hemocentro aparece em tempo real no app do doador."

⚠️ **Se o mobile não estiver rodando**, mostrar o Swagger do endpoint `GET /me/notificacoes` com "Try it out" autenticado como Maria. Funciona como demo alternativa, mas não substitui o app.

---

## Bloco 6 — Relatórios estatísticos (4:15–4:50) — [Integrante 1 ou 2]

**Fala:**
> "A parte estatística usa os dados reais das doações para previsão de demanda e controle de qualidade."

**Ações ao vivo:**
1. Ir em "Relatórios" → **Média de doações** (último ano): gráfico de pizza com distribuição por tipo, total ~180 doações
2. **Estudo de doadores**: barras agrupadas por faixa etária, taxa de retorno 93,8%
3. **Previsão de demanda (SARIMA)**: gráfico de linha com 4 semanas de previsão e intervalo de confiança 95%
4. **CEP (Controle Estatístico de Processo)**: gráfico de pontos da temperatura, com limites de controle e pontos fora de especificação em vermelho

**Fala de fechamento:**
> "Todos os gráficos vêm de funções SQL no banco, com dados de 52 semanas de histórico. É o que permite o hemocentro tomar decisão baseada em dados, não em intuição."

---

## Bloco 7 — Fechamento (4:50–5:00) — [Todos, cada um 1 frase]

**Fala (rotação rápida):**
- Integrante 1: "Backend em produção com 28 endpoints documentados no Swagger."
- Integrante 2: "Banco no Supabase com Row Level Security e relatórios estatísticos."
- Integrante 3: "Dashboard com IoT em tempo real e alertas automáticos."
- Integrante 4: "App mobile e fluxo completo do doador, do cadastro à próxima doação."

**Tela final:** logo do projeto + URL da API.

---

## O que NÃO mostrar no vídeo

- Console do navegador (só se pedir para mostrar logs, e mesmo assim só logs bonitos do backend)
- Mocks — tudo deve estar com dados reais
- Abas do VS Code com arquivos pessoais
- `.env` com chaves (mesmo que públicas)
- Alertas de `npm audit` ou warnings do terminal
- Mais de 2 slides — o foco é a demo prática

## Dicas de gravação

- **OBS Studio** ou **Loom** — ambos gratuitos, gravam tela + áudio
- Gravar em 1080p, 30 fps
- Fazer um "ensaio" sem gravar antes, para pegar tempo
- Se estourar 5 min, cortar o bloco 6 (relatórios) ou reduzir o bloco 2 (arquitetura)
- Cada integrante pode gravar seu bloco separado e editar depois (fácil com CapCut ou DaVinci Resolve), mas o vídeo final precisa ter todos falando
- Upload no YouTube como **público**, link no README do GitHub (exigência do manual)

## Checklist pós-gravação

- [ ] Vídeo com ≤ 5 min
- [ ] Todos os integrantes com fala
- [ ] Foco na demo prática (não em slides)
- [ ] Upload no YouTube como público
- [ ] Link do vídeo no `README.md` do GitHub