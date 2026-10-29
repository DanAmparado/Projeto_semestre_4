# Front web - Nosso Sangue

HTML + CSS + JavaScript (módulos ES, sem build). Não abre por file://; sirva a pasta:
`python3 -m http.server 5500` e acesse http://localhost:5500

Integração real: em `js/supabase.js` coloque a chave `sb_publishable_...`; em `js/config.js` use
`USAR_MOCK = false` e o `HEMOCENTRO_ID` real.
