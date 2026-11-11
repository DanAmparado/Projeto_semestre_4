📡 Módulo IoT — Nosso Sangue
Este diretório contém o firmware e o guia de simulação do dispositivo ESP32 responsável por monitorar a câmara fria e o estoque de bolsas de sangue do projeto Nosso Sangue.

🎯 Visão Geral
O ESP32 simulado realiza duas funções principais:

Monitoramento Ambiental: Lê a temperatura e a umidade da câmara fria usando um sensor DHT22.

Controle de Estoque: Lê o peso de 8 prateleiras (uma para cada tipo sanguíneo) usando módulos HX711 com células de carga de 5kg.

Os dados são enviados via HTTP POST para a API do projeto no Render, que os persiste no Supabase. O dispositivo também possui atuadores locais: um servo motor (simulando a ventoinha da câmara fria), um buzzer (alerta sonoro) e um LED (alerta visual).

🔌 Pinagem (ESP32-S3)
A simulação foi desenvolvida para a placa ESP32-S3 WROOM-1 no Cirkit Designer. A tabela abaixo mostra a pinagem utilizada no firmware sketch.ino.

Componente	Pino no ESP32-S3	Observação
DHT22	15	Sensor de Temperatura e Umidade
Servo (Ventoinha)	21	Controle de abertura da ventoinha
Buzzer (Piezo)	47	Alerta sonoro de estoque crítico
LED	48	Alerta visual (comunicado de doadores)
HX711 (8x)	DAT: 1, 2, 4, 5, 6, 7, 8, 9
CLK: 10, 11, 12, 13, 14, 16, 17, 18	Cada par DAT/CLK corresponde a uma balança (A+, A-, B+, B-, AB+, AB-, O+, O-)
Atenção: Os pinos 34, 35, 36 e 39 do ESP32 clássico não existem na ESP32-S3. Por isso, a pinagem foi adaptada para os GPIOs disponíveis na placa S3.

🚀 Como Executar a Simulação
1. Pré-requisitos
Conta no Cirkit Designer.

O backend do projeto deve estar rodando e acessível (ex.: no Render).

A IOT_KEY válida gerada pelo backend.

2. Configuração do Código
Abra o Cirkit Designer e crie um novo projeto com a placa ESP32-S3.

Copie o conteúdo do arquivo sketch.ino para o editor de código do Cirkit.

⚠️ IMPORTANTE: No topo do sketch.ino, atualize as três constantes abaixo com as informações do seu ambiente:

cpp
const char* API_URL_AMBIENTE = "https://sua-api.onrender.com/api/v1/iot/ambiente";
const char* API_URL_BALANCA  = "https://sua-api.onrender.com/api/v1/iot/balanca";
const char* IOT_KEY          = "SUA_IOT_KEY_AQUI";
Monte o circuito no Cirkit seguindo a tabela de pinagem acima.

Inicie a simulação. O Wi-Fi padrão do Cirkit (CirkitWifi) será utilizado automaticamente.

🧠 Lógica de Negócio Implementada
O firmware embarca algumas regras de negócio diretamente no dispositivo:

Controle da Câmara Fria: Se a temperatura lida for maior que 6,0 °C, o servo motor é acionado (ventoinha ligada). Quando a temperatura normaliza, o servo retorna à posição inicial.

Alerta de Estoque Crítico: Se qualquer balança registrar 2 bolsas ou menos (considerando 0.450 kg por bolsa), o buzzer começa a apitar intermitentemente e o LED de alerta é acionado.

Rodízio de Envio: Para não sobrecarregar a API, o ESP32 envia os dados de uma balança por ciclo (a cada 2 segundos). Assim, todas as 8 balanças são atualizadas a cada 16 segundos.

🚨 Notas de Solução de Problemas (Troubleshooting)
Durante o desenvolvimento, alguns obstáculos foram encontrados e resolvidos. Documentá-los ajuda futuros mantenedores:

Erro 403 Forbidden (Ngrok / Cloudflare Quick Tunnel): Ferramentas de túnel como Ngrok e Cloudflare Quick Tunnel possuem firewalls (WAF) que bloqueiam requisições de clientes IoT (como o ESP32 simulado), mesmo que o User-Agent seja falsificado.

Solução: Aponte o código do Cirkit diretamente para a URL do Render, sem túneis intermediários. O Render aceita a conexão e o ESP32 recebe HTTP 201.

Erro 404 Not Found nas Balanças: A API retorna 404 quando o device_id (ESP32-BALANCA-A+, etc.) não está cadastrado na tabela sensores do Supabase.

Solução: Execute o script de seed do banco de dados para inserir os 8 dispositivos de balança antes de iniciar a simulação.

Dashboard não atualiza (Vercel): O Next.js faz cache das páginas por padrão.

Solução: Adicione export const dynamic = 'force-dynamic'; no topo da página do dashboard ou force o recarregamento com Ctrl + F5.

📁 Estrutura da Pasta
text
iot/
├── README.md          # Este guia
├── sketch.ino         # Firmware completo para o Cirkit Designer
└── diagram.json       # (Opcional) Exportação do circuito do Cirkit