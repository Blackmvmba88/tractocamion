#!/usr/bin/env bash
set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
STRICT="${STRICT:-1}"
VERBOSE="${VERBOSE:-1}"
REQUEST_TIMEOUT_SECONDS="${REQUEST_TIMEOUT_SECONDS:-15}"
SERVER_WAIT_RETRIES="${SERVER_WAIT_RETRIES:-10}"
SERVER_WAIT_INTERVAL_SECONDS="${SERVER_WAIT_INTERVAL_SECONDS:-2}"
AUTHLESS_CYCLES_EXPECTED_STATUS="${AUTHLESS_CYCLES_EXPECTED_STATUS:-200}"
RUN_ID=$(date +%s)

PASSED=0
FAILED=0
SKIPPED=0
TOKEN=""
CYCLE_ID=""
NFC_TAG_ID="TEST-NFC-$RUN_ID"
CREATED_CYCLE_COMPLETED=0
REGISTERED_NFC=0

log() { echo "[$(date +%H:%M:%S)] $*"; }
pass() { echo "✅ $*"; PASSED=$((PASSED+1)); }
fail() { echo "❌ $*"; FAILED=$((FAILED+1)); [ "$STRICT" = "1" ] && exit 1; }
skip() { echo "⏭️  $*"; SKIPPED=$((SKIPPED+1)); }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing dependency: $1"
    exit 1
  }
}

json_get() {
  local json="$1"
  local query="$2"
  echo "$json" | jq -r "$query"
}

request() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"
  local auth="${4:-0}"

  local headers=(-H "Content-Type: application/json")
  if [ "$auth" = "1" ] && [ -n "${TOKEN:-}" ]; then
    headers+=(-H "Authorization: Bearer $TOKEN")
  fi

  if [ -n "$data" ]; then
    curl -sS --connect-timeout 5 --max-time "$REQUEST_TIMEOUT_SECONDS" \
      -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" "${headers[@]}" -d "$data"
  else
    curl -sS --connect-timeout 5 --max-time "$REQUEST_TIMEOUT_SECONDS" \
      -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" "${headers[@]}"
  fi
}

split_response() {
  local raw="$1"
  HTTP_BODY=$(echo "$raw" | sed '$d')
  HTTP_CODE=$(echo "$raw" | tail -n1)
}

assert_status() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [ "$expected" = "$actual" ]; then
    pass "$label (status $actual)"
  else
    fail "$label expected $expected got $actual"
  fi
}

assert_json_field() {
  local json="$1"
  local query="$2"
  local label="$3"
  local value
  value=$(echo "$json" | jq -er "$query" 2>/dev/null) || {
    fail "$label missing field: $query"
    return
  }
  pass "$label"
}

cleanup() {
  local cleanup_failed=0

  if [ "$REGISTERED_NFC" = "1" ] && [ -n "${TOKEN:-}" ]; then
    local raw
    raw=$(request POST "/api/nfc/unregister" "$(jq -nc --arg operator_id "$TEST_OPERATOR_ID" '{operator_id:$operator_id}')" 1)
    split_response "$raw"
    case "$HTTP_CODE" in
      200|400|404)
        ;;
      *)
        cleanup_failed=1
        log "cleanup warning: could not unregister NFC tag (status $HTTP_CODE)"
        ;;
    esac
  fi

  if [ "$CREATED_CYCLE_COMPLETED" = "0" ] && [ -n "${CYCLE_ID:-}" ] && [ -n "${TOKEN:-}" ]; then
    local raw
    raw=$(request POST "/api/cycles/$CYCLE_ID/complete" '{"end_location":"Cleanup Location"}' 1)
    split_response "$raw"
    case "$HTTP_CODE" in
      200|400|404)
        ;;
      *)
        cleanup_failed=1
        log "cleanup warning: could not complete cycle $CYCLE_ID (status $HTTP_CODE)"
        ;;
    esac
  fi

  return "$cleanup_failed"
}

check_dependencies() {
  require_cmd curl
  require_cmd jq
  pass "dependencies ok"
}

check_server() {
  local attempt=1
  local raw=""

  while [ "$attempt" -le "$SERVER_WAIT_RETRIES" ]; do
    raw=$(curl -sS --connect-timeout 5 --max-time "$REQUEST_TIMEOUT_SECONDS" \
      -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null || true)

    if [ "$raw" = "200" ]; then
      pass "server reachable at $BASE_URL"
      return 0
    fi

    if [ "$attempt" -lt "$SERVER_WAIT_RETRIES" ]; then
      log "waiting for server ($attempt/$SERVER_WAIT_RETRIES, status ${raw:-000})"
      sleep "$SERVER_WAIT_INTERVAL_SECONDS"
    fi

    attempt=$((attempt+1))
  done

  fail "server not reachable at $BASE_URL after $SERVER_WAIT_RETRIES attempts (last status ${raw:-000})"
}

login() {
  local payload
  payload=$(jq -nc --arg login "$TEST_LOGIN" --arg password "$TEST_PASSWORD" \
    '{login:$login,password:$password}')

  raw=$(request POST "/api/auth/login" "$payload" 0)
  split_response "$raw"

  assert_status 200 "$HTTP_CODE" "login"
  assert_json_field "$HTTP_BODY" '.token' "login returns token"

  TOKEN=$(json_get "$HTTP_BODY" '.token')
  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    fail "token extraction failed"
  else
    pass "token captured"
  fi
}

test_public_cycles_route_without_token() {
  raw=$(request GET "/api/cycles" "" 0)
  split_response "$raw"
  if [ "$HTTP_CODE" = "$AUTHLESS_CYCLES_EXPECTED_STATUS" ]; then
    pass "cycles route unauthenticated behavior matches expectation ($HTTP_CODE)"
  else
    fail "cycles route expected unauthenticated status $AUTHLESS_CYCLES_EXPECTED_STATUS, got $HTTP_CODE"
  fi
}

test_invalid_login() {
  local payload
  payload=$(jq -nc '{login:"invalid",password:"wrong"}')

  raw=$(request POST "/api/auth/login" "$payload" 0)
  split_response "$raw"

  case "$HTTP_CODE" in
    401) pass "invalid login rejected" ;;
    *) fail "invalid login should return 401, got $HTTP_CODE" ;;
  esac
}

test_create_cycle() {
  local payload
  payload=$(jq -nc --arg truck_id "$TEST_TRUCK_ID" --arg operator_id "$TEST_OPERATOR_ID" \
    '{truck_id:$truck_id,operator_id:$operator_id,start_location:"Test Location"}')

  raw=$(request POST "/api/cycles" "$payload" 1)
  split_response "$raw"

  case "$HTTP_CODE" in
    201) pass "create cycle status ok" ;;
    *) fail "create cycle failed with $HTTP_CODE: $HTTP_BODY" ;;
  esac

  assert_json_field "$HTTP_BODY" '.success' "create cycle returns success"
  assert_json_field "$HTTP_BODY" '.cycle.id' "create cycle returns cycle id"

  CYCLE_ID=$(json_get "$HTTP_BODY" '.cycle.id')
  if [ -z "$CYCLE_ID" ] || [ "$CYCLE_ID" = "null" ]; then
    fail "cycle id extraction failed"
  else
    pass "cycle id captured: $CYCLE_ID"
    CREATED_CYCLE_COMPLETED=0
  fi
}

test_create_cycle_invalid_truck() {
  local payload
  payload=$(jq -nc --arg operator_id "$TEST_OPERATOR_ID" \
    '{truck_id:"INVALID",operator_id:$operator_id,start_location:"Test"}')

  raw=$(request POST "/api/cycles" "$payload" 1)
  split_response "$raw"

  case "$HTTP_CODE" in
    404) pass "invalid truck rejected" ;;
    *) fail "invalid truck should return 404, got $HTTP_CODE" ;;
  esac
}

test_register_nfc() {
  local payload
  payload=$(jq -nc --arg operator_id "$TEST_OPERATOR_ID" --arg tag_id "$NFC_TAG_ID" \
    '{operator_id:$operator_id,tag_id:$tag_id}')

  raw=$(request POST "/api/nfc/register" "$payload" 1)
  split_response "$raw"

  case "$HTTP_CODE" in
    200) pass "register nfc status ok" ;;
    *) fail "register nfc failed with $HTTP_CODE: $HTTP_BODY" ;;
  esac

  assert_json_field "$HTTP_BODY" '.success' "register nfc returns success"
  REGISTERED_NFC=1
}

test_register_nfc_duplicate() {
  local payload
  payload=$(jq -nc --arg operator_id "$TEST_OPERATOR_ID" --arg tag_id "$NFC_TAG_ID" \
    '{operator_id:$operator_id,tag_id:$tag_id}')

  raw=$(request POST "/api/nfc/register" "$payload" 1)
  split_response "$raw"

  case "$HTTP_CODE" in
    400) pass "duplicate nfc tag rejected" ;;
    *) fail "duplicate nfc should return 400, got $HTTP_CODE" ;;
  esac
}

test_verify_nfc() {
  local payload
  payload=$(jq -nc --arg tag_id "$NFC_TAG_ID" '{tag_id:$tag_id}')

  raw=$(request POST "/api/nfc/verify" "$payload" 1)
  split_response "$raw"

  case "$HTTP_CODE" in
    200) pass "verify nfc status ok" ;;
    *) fail "verify nfc failed with $HTTP_CODE: $HTTP_BODY" ;;
  esac

  assert_json_field "$HTTP_BODY" '.success' "verify nfc returns success"
}

test_verify_nfc_invalid() {
  local payload
  payload=$(jq -nc '{tag_id:"INVALID-TAG"}')

  raw=$(request POST "/api/nfc/verify" "$payload" 1)
  split_response "$raw"

  case "$HTTP_CODE" in
    404) pass "invalid nfc tag rejected" ;;
    *) fail "invalid nfc should return 404, got $HTTP_CODE" ;;
  esac
}

test_analytics_dashboard() {
  raw=$(request GET "/api/analytics/dashboard" "" 1)
  split_response "$raw"

  assert_status 200 "$HTTP_CODE" "analytics dashboard"
  echo "$HTTP_BODY" | jq . >/dev/null 2>&1 || fail "analytics dashboard response is not valid JSON"
  pass "analytics dashboard JSON valid"
}

test_analytics_alerts() {
  raw=$(request GET "/api/analytics/alerts" "" 1)
  split_response "$raw"

  assert_status 200 "$HTTP_CODE" "analytics alerts"
  echo "$HTTP_BODY" | jq . >/dev/null 2>&1 || fail "analytics alerts response is not valid JSON"
  pass "analytics alerts JSON valid"
}

test_analytics_operators() {
  raw=$(request GET "/api/analytics/operators" "" 1)
  split_response "$raw"

  assert_status 200 "$HTTP_CODE" "analytics operators"
  echo "$HTTP_BODY" | jq . >/dev/null 2>&1 || fail "analytics operators response is not valid JSON"
  pass "analytics operators JSON valid"
}

test_analytics_trucks() {
  raw=$(request GET "/api/analytics/trucks" "" 1)
  split_response "$raw"

  assert_status 200 "$HTTP_CODE" "analytics trucks"
  echo "$HTTP_BODY" | jq . >/dev/null 2>&1 || fail "analytics trucks response is not valid JSON"
  pass "analytics trucks JSON valid"
}

test_get_cycles() {
  raw=$(request GET "/api/cycles" "" 1)
  split_response "$raw"

  assert_status 200 "$HTTP_CODE" "get cycles"
  echo "$HTTP_BODY" | jq . >/dev/null 2>&1 || fail "get cycles response is not valid JSON"
  pass "get cycles JSON valid"
}

test_cycle_location_update() {
  if [ -z "$CYCLE_ID" ]; then
    skip "cycle location update (no cycle created)"
    return
  fi

  local payload
  payload=$(jq -nc '{location:"Updated Location"}')

  raw=$(request PATCH "/api/cycles/$CYCLE_ID/location" "$payload" 1)
  split_response "$raw"

  case "$HTTP_CODE" in
    200) pass "cycle location update ok" ;;
    *) fail "cycle location update failed with $HTTP_CODE: $HTTP_BODY" ;;
  esac
}

test_cycle_completion() {
  if [ -z "$CYCLE_ID" ]; then
    skip "cycle completion (no cycle created)"
    return
  fi

  local payload
  payload=$(jq -nc '{end_location:"Completion Location"}')

  raw=$(request POST "/api/cycles/$CYCLE_ID/complete" "$payload" 1)
  split_response "$raw"

  case "$HTTP_CODE" in
    200) pass "cycle completion ok" ;;
    *) fail "cycle completion failed with $HTTP_CODE: $HTTP_BODY" ;;
  esac
  CREATED_CYCLE_COMPLETED=1
}

summary() {
  echo
  echo "========== SUMMARY =========="
  echo "PASSED : $PASSED"
  echo "FAILED : $FAILED"
  echo "SKIPPED: $SKIPPED"
  echo "============================="
  [ "$FAILED" -eq 0 ]
}

main() {
  TEST_LOGIN="${TEST_LOGIN:-admin}"
  TEST_PASSWORD="${TEST_PASSWORD:-Admin123!}"
  TEST_TRUCK_ID="${TEST_TRUCK_ID:-TRK-001}"
  TEST_OPERATOR_ID="${TEST_OPERATOR_ID:-1}"

  echo "🚛 Tractocamión 4.0 - Enhanced Integration Test Suite"
  echo "======================================================"
  echo "BASE_URL: $BASE_URL"
  echo "STRICT: $STRICT"
  echo "RUN_ID: $RUN_ID"
  echo "AUTHLESS_CYCLES_EXPECTED_STATUS: $AUTHLESS_CYCLES_EXPECTED_STATUS"
  echo "======================================================"
  echo ""

  trap cleanup EXIT

  check_dependencies
  check_server
  test_public_cycles_route_without_token
  test_invalid_login
  login

  # Positive tests
  test_create_cycle
  test_register_nfc
  test_verify_nfc
  test_analytics_dashboard
  test_analytics_alerts
  test_analytics_operators
  test_analytics_trucks
  test_get_cycles
  test_cycle_location_update
  test_cycle_completion

  # Negative tests
  test_create_cycle_invalid_truck
  test_register_nfc_duplicate
  test_verify_nfc_invalid

  summary
}

main "$@"
