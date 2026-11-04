#!/usr/bin/env bash
# Smoke test da API Nosso Sangue
# Uso: ./smoke-test.sh [URL_BASE]
# Padrão: produção no Render

set -e

BASE="${1:-https://nosso-sangue-api.onrender.com/api/v1}"
SUPABASE_URL="https://qspukyphnexyrhltabel.supabase.co"
PUBLISHABLE="sb_publishable_n-RuEpTqOjMWSRpmuWMi4w_w_0jf8Ns"
HEMOCENTRO="11111111-1111-1111-1111-111111111111"
FUNC_EMAIL="funcionario@test.local"
FUNC_SENHA="senha123"

PASS=0
FAIL=0

check() {
  local nome="$1" esperado="$2" obtido="$3" body="$4"
  if [ "$esperado" = "$obtido" ]; then
    echo "✅ $nome → HTTP $obtido"
    PASS=$((PASS + 1))
  else
    echo "❌ $nome → HTTP $obtido (esperado $esperado)"
    echo "   $(echo "$body" | head -c 200)"
    FAIL=$((FAIL + 1))
  fi
}

req() {
  curl -s -w "\n%{http_code}" "$@"
}

extract_body() { echo "$1" | head -n -1; }
extract_code() { echo "$1" | tail -n 1; }

echo "🔍 Smoke test contra $BASE"
echo ""

# Público
R=$(req "$BASE/health")
check "Health" 200 "$(extract_code "$R")" "$(extract_body "$R")"

R=$(req "$BASE/publico/hemocentros")
check "Público hemocentros" 200 "$(extract_code "$R")" "$(extract_body "$R")"

R=$(req "$BASE/publico/hemocentros/$HEMOCENTRO/estoque")
check "Público estoque" 200 "$(extract_code "$R")" "$(extract_body "$R")"

# Login
R=$(req -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: $PUBLISHABLE" \
  -d "{\"email\":\"$FUNC_EMAIL\",\"password\":\"$FUNC_SENHA\"}")
check "Login Supabase" 200 "$(extract_code "$R")" "$(extract_body "$R")"

TOKEN=$(extract_body "$R" | grep -oE '"access_token":"[^"]+"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "❌ Falha ao extrair access_token; abortando testes autenticados"
  exit 1
fi

AUTH=(-H "Authorization: Bearer $TOKEN")

# Autenticados
R=$(req "$BASE/me" "${AUTH[@]}")
check "/me autenticado" 200 "$(extract_code "$R")" "$(extract_body "$R")"

R=$(req "$BASE/hemocentros/$HEMOCENTRO/doadores?cpf=12345678900" "${AUTH[@]}")
check "Busca doador por CPF" 200 "$(extract_code "$R")" "$(extract_body "$R")"

R=$(req "$BASE/hemocentros/$HEMOCENTRO/alertas?resolvido=false" "${AUTH[@]}")
check "Alertas pendentes" 200 "$(extract_code "$R")" "$(extract_body "$R")"

R=$(req "$BASE/hemocentros/$HEMOCENTRO/relatorios/media-doacoes?inicio=2025-11-01&fim=2026-10-31" "${AUTH[@]}")
check "Relatório média doações" 200 "$(extract_code "$R")" "$(extract_body "$R")"

R=$(req "$BASE/hemocentros/$HEMOCENTRO/relatorios/estudo-doadores?inicio=2025-11-01&fim=2026-10-31" "${AUTH[@]}")
check "Relatório estudo doadores" 200 "$(extract_code "$R")" "$(extract_body "$R")"

R=$(req "$BASE/hemocentros/$HEMOCENTRO/dashboard/resumo" "${AUTH[@]}")
check "Dashboard resumo" 200 "$(extract_code "$R")" "$(extract_body "$R")"

# Swagger
R=$(req "https://nosso-sangue-api.onrender.com/docs/")
check "Swagger UI" 200 "$(extract_code "$R")" "$(extract_body "$R")"

R=$(req "https://nosso-sangue-api.onrender.com/openapi.yaml")
check "openapi.yaml servido" 200 "$(extract_code "$R")" "$(extract_body "$R")"

echo ""
echo "Resultado: $PASS passaram, $FAIL falharam"

[ "$FAIL" -gt 0 ] && exit 1
exit 0