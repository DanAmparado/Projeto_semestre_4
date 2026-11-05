# Front web - Nosso Sangue

HTML + CSS + JavaScript (módulos ES, sem build). Não abre por file://; sirva a pasta:
`python3 -m http.server 5500` e acesse http://localhost:5500

No Windows, acesse via http://127.0.0.1:5500 em vez de http://localhost:5500. O browser resolve localhost para IPv6 ([::1]) primeiro, e o CORS do backend (que usa 127.0.0.1) pode bloquear. Acessar via IPv4 explícito resolve.

Integração real: em `js/supabase.js` coloque a chave `sb_publishable_...`; em `js/config.js` use
`USAR_MOCK = false` e o `HEMOCENTRO_ID` real.
