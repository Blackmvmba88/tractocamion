#!/bin/bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000/api}"
TEST_LOGIN="${TEST_LOGIN:-admin}"
TEST_PASSWORD="${TEST_PASSWORD:-Admin123!}"

command -v jq >/dev/null || { echo "jq es obligatorio"; exit 1; }

echo "Verificando salud del servidor..."
curl --fail --silent --show-error "$BASE_URL/health" | jq .

echo "Iniciando sesión de prueba..."
TOKEN="$({ curl --fail --silent --show-error -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg login "$TEST_LOGIN" --arg password "$TEST_PASSWORD" '{login:$login,password:$password}')"; } | jq -er '.token')"
AUTH_HEADER="Authorization: Bearer $TOKEN"

echo "Verificando dashboard protegido..."
curl --fail --silent --show-error "$BASE_URL/analytics/dashboard" -H "$AUTH_HEADER" | jq '{summary, today, performance}'

echo "Verificando alertas protegidas..."
curl --fail --silent --show-error "$BASE_URL/analytics/alerts" -H "$AUTH_HEADER" | jq '{total, by_severity}'

echo "Verificando consultas de flota protegidas..."
curl --fail --silent --show-error "$BASE_URL/trucks" -H "$AUTH_HEADER" | jq '{total, active}'
curl --fail --silent --show-error "$BASE_URL/operators" -H "$AUTH_HEADER" | jq '{total, available}'

echo "Integración de lectura completada correctamente."
echo "Las mutaciones de NFC y ciclos se excluyen para no alterar datos sin una prueba aislada."
