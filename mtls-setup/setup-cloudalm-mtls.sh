#!/usr/bin/env bash
#
# setup-calm-mtls.sh  --  SAP Cloud ALM API / mTLS helper (macOS & Linux)
#
# Takes the service key JSON that SAP BTP shows you after creating an
# "x509" service key and produces everything you need to call the
# SAP Cloud ALM APIs with mutual TLS:
#
#   certificate.pem   client certificate (+ CA chain)  -> curl --cert
#   key.pem           private key                      -> curl --key
#   certificate.pfx   PKCS#12 bundle, password protected
#                                                      -> Postman, Java, SoapUI, ...
#   calm-api.env      the non-secret values (client id, token URL, API URL)
#
# It then requests a real access token so you know the setup works.
#
# Usage:
#   ./setup-calm-mtls.sh                        # asks for the file / uses clipboard
#   ./setup-calm-mtls.sh service-key.json
#   ./setup-calm-mtls.sh service-key.json -o ~/calm -p 'MyPassword'
#
# Options:
#   -o, --output DIR   where to write the files (default: current folder)
#   -p, --password PW  password for certificate.pfx (otherwise asked interactively,
#                      or taken from the CALM_PFX_PASSWORD environment variable)
#       --no-test      skip the "request an access token" check
#       --force        overwrite existing files
#   -h, --help         show this help
#
# Requires only tools that are already part of macOS and Linux:
# bash, awk, sed, curl, openssl.

set -u

SCRIPT_NAME=$(basename "$0")

JSON_INPUT=""
OUT_DIR="."
PFX_PASSWORD="${CALM_PFX_PASSWORD:-}"
RUN_TEST=1
FORCE=0
TMP_FILES=""

# ---------------------------------------------------------------- output ----

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RED=$(printf '\033[31m'); C_GRN=$(printf '\033[32m')
  C_YEL=$(printf '\033[33m'); C_BLU=$(printf '\033[36m')
  C_BLD=$(printf '\033[1m');  C_OFF=$(printf '\033[0m')
else
  C_RED=""; C_GRN=""; C_YEL=""; C_BLU=""; C_BLD=""; C_OFF=""
fi

step()  { printf '\n%s==>%s %s%s%s\n' "$C_BLU" "$C_OFF" "$C_BLD" "$1" "$C_OFF"; }
ok()    { printf '    %s[ok]%s %s\n'   "$C_GRN" "$C_OFF" "$1"; }
note()  { printf '         %s\n' "$1"; }
warn()  { printf '    %s[warning]%s %s\n' "$C_YEL" "$C_OFF" "$1" >&2; }

problem() {
  printf '\n    %s[failed]%s %s\n' "$C_YEL" "$C_OFF" "$1" >&2
  shift
  for line in "$@"; do printf '             %s\n' "$line" >&2; done
}

die() {
  printf '\n%s[error]%s %s\n' "$C_RED" "$C_OFF" "$1" >&2
  shift
  for line in "$@"; do printf '        %s\n' "$line" >&2; done
  printf '\n' >&2
  cleanup
  exit 1
}

cleanup() {
  for f in $TMP_FILES; do [ -f "$f" ] && rm -f "$f"; done
  TMP_FILES=""
}
trap cleanup EXIT INT TERM

mktemp_secure() {
  f=$(mktemp 2>/dev/null || mktemp -t calm) || die "Could not create a temporary file."
  chmod 600 "$f" 2>/dev/null
  TMP_FILES="$TMP_FILES $f"
  printf '%s' "$f"
}

usage() { sed -n '3,33p' "$0" | sed 's/^# \{0,1\}//'; }

# ------------------------------------------------------------ arguments -----

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help)     usage; exit 0 ;;
    -o|--output)   [ $# -ge 2 ] || die "Option $1 needs a folder name."; OUT_DIR="$2"; shift 2 ;;
    -p|--password) [ $# -ge 2 ] || die "Option $1 needs a password.";    PFX_PASSWORD="$2"; shift 2 ;;
    --no-test)     RUN_TEST=0; shift ;;
    --force)       FORCE=1; shift ;;
    -*)            die "Unknown option: $1" "Run '$SCRIPT_NAME --help' to see all options." ;;
    *)             JSON_INPUT="$1"; shift ;;
  esac
done

# ------------------------------------------------------------- helpers ------

# Cleans up a path the way it arrives when a file is dragged into a terminal:
# a trailing blank, surrounding quotes, backslash-escaped special characters,
# a file:// prefix (Linux file managers) and a leading ~.
clean_path() {
  p="$1"
  # 1. drag & drop appends a blank, copy & paste often adds line breaks
  p=$(printf '%s' "$p" | tr -d '\r\n' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
  # 2. surrounding quotes
  case "$p" in
    \"*\") p="${p#\"}"; p="${p%\"}" ;;
    \'*\') p="${p#\'}"; p="${p%\'}" ;;
  esac
  p=$(printf '%s' "$p" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
  # 3. file:///path/my%20file.json
  case "$p" in
    file://*) p=$(printf '%s' "${p#file://}" | sed 's/%20/ /g') ;;
  esac
  # 4. Finder escapes blanks and special characters with a backslash
  p=$(printf '%s' "$p" | sed 's/\\\(.\)/\1/g')
  # 5. home directory
  case "$p" in "~"|"~/"*) p="$HOME${p#\~}" ;; esac
  printf '%s' "$p"
}

# Reads a string value out of a JSON file without needing jq/python.
# json_get <file> <key>   ->  prints the raw (still escaped) value, exit 1 if absent
json_get() {
  awk -v key="$2" '
    { data = data $0 "\n" }
    END {
      pat = "\"" key "\""
      start = 1
      while ((i = index(substr(data, start), pat)) > 0) {
        s = start + i - 1
        j = s + length(pat)
        while (j <= length(data) && substr(data, j, 1) ~ /[ \t\r\n]/) j++
        if (substr(data, j, 1) != ":") { start = s + 1; continue }
        j++
        while (j <= length(data) && substr(data, j, 1) ~ /[ \t\r\n]/) j++
        if (substr(data, j, 1) != "\"") { start = s + 1; continue }
        j++
        out = ""
        while (j <= length(data)) {
          c = substr(data, j, 1)
          if (c == "\\") { out = out c substr(data, j + 1, 1); j += 2; continue }
          if (c == "\"") break
          out = out c
          j++
        }
        print out
        exit 0
      }
      exit 1
    }' "$1"
}

# Turns the JSON escapes (\n, \r, \") of a PEM block into real characters.
json_unescape() {
  printf '%s' "$1" | awk '{ gsub(/\\r/, ""); gsub(/\\"/, "\""); gsub(/\\n/, "\n"); printf "%s", $0 } END { printf "\n" }'
}

# Writes the first (= client) certificate of a PEM file that holds a chain.
pem_leaf() { awk '/-----BEGIN CERTIFICATE-----/ { n++ } n == 1 { print }' "$1"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 && return 0
  die "The command '$1' was not found on this computer." \
      "It is normally pre-installed. Install it with one of:" \
      "  macOS         : xcode-select --install     (or: brew install $1)" \
      "  Debian/Ubuntu : sudo apt-get install -y $1" \
      "  RHEL/Fedora   : sudo dnf install -y $1" \
      "  SUSE          : sudo zypper install -y $1"
}

read_password() {
  if [ -n "$PFX_PASSWORD" ]; then return 0; fi
  if [ ! -r /dev/tty ]; then
    die "No password for certificate.pfx was given and this terminal cannot ask for one." \
        "Re-run with:  $SCRIPT_NAME <file.json> -p 'YourPassword'" \
        "or set the environment variable CALM_PFX_PASSWORD first."
  fi
  while :; do
    printf '    Choose a password for certificate.pfx (typing is hidden): ' >&2
    IFS= read -r -s p1 < /dev/tty; printf '\n' >&2
    if [ ${#p1} -lt 4 ]; then warn "Please use at least 4 characters."; continue; fi
    printf '    Repeat the password: ' >&2
    IFS= read -r -s p2 < /dev/tty; printf '\n' >&2
    if [ "$p1" != "$p2" ]; then warn "The two entries did not match, please try again."; continue; fi
    PFX_PASSWORD="$p1"
    break
  done
}

# ------------------------------------------------------------ 0. checks -----

printf '%s\n' "${C_BLD}SAP Cloud ALM - mTLS setup helper${C_OFF}"
printf '%s\n' "Creates certificate.pem, key.pem and certificate.pfx from a service key."

require_cmd awk
require_cmd sed
require_cmd openssl
[ "$RUN_TEST" -eq 1 ] && require_cmd curl

# ------------------------------------------------------- 1. get the JSON ----

step "Step 1/6  Reading the service key"

RAW_JSON_FILE=$(mktemp_secure)

if [ -n "$JSON_INPUT" ]; then
  JSON_INPUT=$(clean_path "$JSON_INPUT")
  [ -e "$JSON_INPUT" ] || die "The file '$JSON_INPUT' does not exist." \
        "Check the path, or simply run '$SCRIPT_NAME' without parameters and" \
        "drag the downloaded service key file into the Terminal window when asked."
  [ -r "$JSON_INPUT" ] || die "The file '$JSON_INPUT' exists but cannot be read (no permission)."
  cat "$JSON_INPUT" > "$RAW_JSON_FILE"
  ok "Using file: $JSON_INPUT"
elif [ ! -t 0 ]; then
  cat > "$RAW_JSON_FILE"
  ok "Read the service key from standard input."
else
  # Nothing given: offer the clipboard (the BTP dialog has a "Copy JSON" button).
  used_clipboard=0
  if command -v pbpaste >/dev/null 2>&1; then
    pbpaste > "$RAW_JSON_FILE" 2>/dev/null
    grep -q '"clientid"' "$RAW_JSON_FILE" 2>/dev/null && used_clipboard=1
  elif command -v xclip >/dev/null 2>&1; then
    xclip -selection clipboard -o > "$RAW_JSON_FILE" 2>/dev/null
    grep -q '"clientid"' "$RAW_JSON_FILE" 2>/dev/null && used_clipboard=1
  fi

  if [ "$used_clipboard" -eq 1 ]; then
    ok "Found a service key in your clipboard - using it."
  else
    printf '    Drag the downloaded service key file into this window\n'
    printf '    (or type its path) and press Enter:\n'
    attempts=0
    while :; do
      printf '    > '
      IFS= read -r answer
      answer=$(clean_path "$answer")
      [ -n "$answer" ] || die "No file was given, nothing to do." \
            "Download the service key from SAP BTP first (button 'Download' in the dialog)."
      [ -e "$answer" ] && break
      attempts=$((attempts + 1))
      [ $attempts -ge 3 ] && die "The file '$answer' does not exist." \
            "Start the script again and pass the file directly, for example:" \
            "  ./$SCRIPT_NAME ~/Downloads/service-key.json"
      warn "'$answer' was not found - please try again."
      note "Tip: drag the file from Finder into this window instead of typing the path."
    done
    cat "$answer" > "$RAW_JSON_FILE"
    ok "Using file: $answer"
  fi
fi

[ -s "$RAW_JSON_FILE" ] && grep -q '{' "$RAW_JSON_FILE" || die \
  "The service key is empty or is not JSON." \
  "Make sure you used the 'Copy JSON'/'Download' button of the service key dialog" \
  "in SAP BTP and that you copied the complete text including the { } brackets."

# ------------------------------------------------------- 2. extract data ----

step "Step 2/6  Extracting client id, certificate, key and token URL"

CLIENT_ID=$(json_get "$RAW_JSON_FILE" clientid) || CLIENT_ID=""
CERT_RAW=$(json_get "$RAW_JSON_FILE" certificate) || CERT_RAW=""
KEY_RAW=$(json_get "$RAW_JSON_FILE" key) || KEY_RAW=""
CERT_URL=$(json_get "$RAW_JSON_FILE" certurl) || CERT_URL=""
API_URL=$(json_get "$RAW_JSON_FILE" Api) || API_URL=""
CRED_TYPE=$(json_get "$RAW_JSON_FILE" "credential-type") || CRED_TYPE=""

if [ -z "$CERT_RAW" ] || [ -z "$KEY_RAW" ]; then
  if [ -n "$(json_get "$RAW_JSON_FILE" clientsecret 2>/dev/null)" ]; then
    die "This service key uses a client secret, not a certificate (mTLS)." \
        "In SAP BTP create a NEW service key and choose the X.509 configuration," \
        "see https://help.sap.com/docs/cloud-alm/apis/creating-service-keys-mtls"
  fi
  die "Could not find 'certificate' and 'key' in the service key." \
      "Most likely only a part of the JSON was copied." \
      "Please use the 'Download' button in SAP BTP and pass that file to this script."
fi
[ -n "$CLIENT_ID" ] || die "Could not find 'clientid' in the service key." \
      "Please re-download the service key from SAP BTP and try again."
[ -n "$CERT_URL" ] || die "Could not find 'certurl' in the service key." \
      "'certurl' is the mTLS token endpoint (it contains '.cert.'). Without it no token can be" \
      "requested. Re-create the service key with the X.509 configuration."

CERT_URL="${CERT_URL%/}"
case "$CERT_URL" in
  *.cert.*) : ;;
  *) warn "'certurl' does not contain '.cert.' - this is unusual for mTLS keys." ;;
esac

ok "client id : $CLIENT_ID"
ok "token URL : $CERT_URL/oauth/token"
[ -n "$API_URL" ]   && ok "API URL   : $API_URL"
[ -n "$CRED_TYPE" ] && ok "type      : $CRED_TYPE"

# --------------------------------------------------------- 3. write PEMs ----

step "Step 3/6  Writing certificate.pem and key.pem"

OUT_DIR=$(clean_path "$OUT_DIR")
mkdir -p "$OUT_DIR" 2>/dev/null || die "Cannot create the output folder '$OUT_DIR'." \
      "Choose a different folder with:  $SCRIPT_NAME <file.json> -o ~/Desktop/calm"
[ -w "$OUT_DIR" ] || die "The folder '$OUT_DIR' is not writable." \
      "Choose a different folder with:  $SCRIPT_NAME <file.json> -o ~/Desktop/calm"

CERT_FILE="$OUT_DIR/certificate.pem"
KEY_FILE="$OUT_DIR/key.pem"
PFX_FILE="$OUT_DIR/certificate.pfx"
ENV_FILE="$OUT_DIR/calm-api.env"

if [ "$FORCE" -eq 0 ]; then
  for f in "$CERT_FILE" "$KEY_FILE" "$PFX_FILE"; do
    [ -e "$f" ] && die "The file '$f' already exists." \
        "Nothing was changed. Re-run with --force to overwrite," \
        "or write to another folder with -o <folder>."
  done
fi

json_unescape "$CERT_RAW" > "$CERT_FILE" || die "Could not write '$CERT_FILE'."
json_unescape "$KEY_RAW"  > "$KEY_FILE"  || die "Could not write '$KEY_FILE'."
chmod 600 "$KEY_FILE" 2>/dev/null
chmod 644 "$CERT_FILE" 2>/dev/null

grep -q -- '-----BEGIN CERTIFICATE-----' "$CERT_FILE" || die \
  "The extracted certificate does not look like a PEM certificate." \
  "The service key seems to be incomplete - please download it again."
grep -q -- '-----BEGIN .*PRIVATE KEY-----' "$KEY_FILE" || die \
  "The extracted private key does not look like a PEM key." \
  "The service key seems to be incomplete - please download it again."

CERT_COUNT=$(grep -c -- '-----BEGIN CERTIFICATE-----' "$CERT_FILE")
ok "$CERT_FILE   ($CERT_COUNT certificate(s): your client certificate + CA chain)"
ok "$KEY_FILE   (private key, readable only by you)"

# --------------------------------------------------------- 4. validate ------

step "Step 4/6  Checking that certificate and key belong together"

LEAF_FILE=$(mktemp_secure)
pem_leaf "$CERT_FILE" > "$LEAF_FILE"

CERT_MOD=$(openssl x509 -noout -modulus -in "$LEAF_FILE" 2>/dev/null)
[ -n "$CERT_MOD" ] || die "OpenSSL cannot read the certificate in '$CERT_FILE'." \
      "The service key JSON was probably truncated. Please download it again."

KEY_MOD=$(openssl rsa -noout -modulus -in "$KEY_FILE" 2>/dev/null)
if [ -z "$KEY_MOD" ]; then
  KEY_MOD=$(openssl pkey -noout -text -in "$KEY_FILE" >/dev/null 2>&1 && printf 'unknown')
  [ -n "$KEY_MOD" ] || die "OpenSSL cannot read the private key in '$KEY_FILE'." \
        "The service key JSON was probably truncated. Please download it again."
  warn "Key type is not RSA - skipping the certificate/key match check."
elif [ "$CERT_MOD" != "$KEY_MOD" ]; then
  die "The certificate and the private key do not match." \
      "This happens when parts of two different service keys are mixed." \
      "Please download one complete service key and run the script again."
else
  ok "Certificate and private key match."
fi

SUBJECT=$(openssl x509 -noout -subject -in "$LEAF_FILE" 2>/dev/null | sed 's/^subject= *//')
NOT_AFTER=$(openssl x509 -noout -enddate -in "$LEAF_FILE" 2>/dev/null | sed 's/^notAfter=//')
[ -n "$SUBJECT" ] && note "subject: $SUBJECT"

if ! openssl x509 -checkend 0 -noout -in "$LEAF_FILE" >/dev/null 2>&1; then
  warn "This certificate EXPIRED on $NOT_AFTER - create a new service key in SAP BTP."
elif ! openssl x509 -checkend 2592000 -noout -in "$LEAF_FILE" >/dev/null 2>&1; then
  warn "This certificate expires on $NOT_AFTER (less than 30 days) - plan the renewal."
else
  ok "Certificate is valid until $NOT_AFTER."
fi

# --------------------------------------------------------- 5. build pfx -----

step "Step 5/6  Creating certificate.pfx"

read_password

# certificate.pem already contains the client certificate followed by the CA
# chain, so it can be handed to OpenSSL as it is: the certificate matching the
# private key becomes the leaf, the remaining ones are added as chain.
#
# The password is handed over through the environment, never on the command
# line - otherwise other users could read it in the process list.
CALM_PFX_PASS_INTERNAL="$PFX_PASSWORD"
export CALM_PFX_PASS_INTERNAL

PFX_ERR=$(mktemp_secure)
openssl pkcs12 -export \
    -in "$CERT_FILE" \
    -inkey "$KEY_FILE" \
    -out "$PFX_FILE" \
    -passout env:CALM_PFX_PASS_INTERNAL 2>"$PFX_ERR"
PFX_RC=$?
unset CALM_PFX_PASS_INTERNAL

if [ $PFX_RC -ne 0 ] || [ ! -s "$PFX_FILE" ]; then
  die "OpenSSL could not create '$PFX_FILE'." \
      "OpenSSL said: $(tr '\n' ' ' < "$PFX_ERR")" \
      "certificate.pem and key.pem were created and can already be used with curl."
fi
chmod 600 "$PFX_FILE" 2>/dev/null
ok "$PFX_FILE   (protected with the password you entered)"

{
  echo "# SAP Cloud ALM API - non-secret connection data"
  echo "# Created by $SCRIPT_NAME on $(date)"
  echo "CALM_CLIENT_ID=$CLIENT_ID"
  echo "CALM_TOKEN_URL=$CERT_URL/oauth/token"
  [ -n "$API_URL" ] && echo "CALM_API_URL=$API_URL"
} > "$ENV_FILE"
ok "$ENV_FILE   (client id and URLs, no secrets)"

# --------------------------------------------------------- 6. token test ----

if [ "$RUN_TEST" -eq 1 ]; then
  step "Step 6/6  Requesting a test access token"

  BODY_FILE=$(mktemp_secure)
  CURL_ERR=$(mktemp_secure)
  HTTP_CODE=$(curl -sS --max-time 60 \
      -o "$BODY_FILE" -w '%{http_code}' \
      --cert "$CERT_FILE" --key "$KEY_FILE" \
      -X POST "$CERT_URL/oauth/token" \
      --data-urlencode 'grant_type=client_credentials' \
      --data-urlencode "client_id=$CLIENT_ID" 2>"$CURL_ERR")
  CURL_RC=$?

  if [ $CURL_RC -ne 0 ]; then
    CURL_MSG=$(tr '\n' ' ' < "$CURL_ERR")
    case $CURL_RC in
      5|6)         HINT="The host name could not be resolved. Check your internet connection, VPN or company proxy." ;;
      7)           HINT="The connection was refused. A firewall or proxy is probably blocking outgoing HTTPS." ;;
      28)          HINT="The request timed out. Check VPN / proxy settings." ;;
      35|58|60|77) HINT="TLS handshake failed. Usually a company proxy that inspects HTTPS traffic - mutual TLS cannot work through it. Ask your network team to exclude *.authentication.cert.*.hana.ondemand.com." ;;
      *)           HINT="See https://curl.se/libcurl/c/libcurl-errors.html for curl error $CURL_RC." ;;
    esac
    problem "The test call to $CERT_URL/oauth/token failed (curl error $CURL_RC) - the files themselves are fine." \
        "curl said: $CURL_MSG" "$HINT"
  elif [ "$HTTP_CODE" = "200" ]; then
    EXPIRES=$(json_get "$BODY_FILE" expires_in 2>/dev/null || true)
    TOKEN=$(json_get "$BODY_FILE" access_token 2>/dev/null || true)
    if [ -n "$TOKEN" ]; then
      ok "Access token received (first 20 characters: $(printf '%.20s' "$TOKEN")...)."
    else
      ok "The token endpoint answered with HTTP 200."
    fi
    [ -n "$EXPIRES" ] && note "The token is valid for a limited time; request a new one when it expires."
  else
    BODY=$(tr '\n' ' ' < "$BODY_FILE" | cut -c1-400)
    case "$HTTP_CODE" in
      401) HINT="HTTP 401 - the client id was rejected. Make sure the whole clientid including the part after '|' is used." ;;
      400) HINT="HTTP 400 - the request was rejected. Usually a wrong or incomplete client id." ;;
      403) HINT="HTTP 403 - the client certificate was not accepted. The service key may have been deleted in SAP BTP." ;;
      404) HINT="HTTP 404 - wrong URL. Use the value of 'certurl' plus '/oauth/token'." ;;
      5*)  HINT="The authentication server reported a temporary problem. Try again in a few minutes." ;;
      *)   HINT="Unexpected answer from the authentication server." ;;
    esac
    problem "The test call returned HTTP $HTTP_CODE - the files themselves are fine." \
        "$HINT" "Server answer: $BODY"
  fi
else
  step "Step 6/6  Test skipped (--no-test)"
fi

# ------------------------------------------------------------- summary ------

ABS_DIR=$(cd "$OUT_DIR" 2>/dev/null && pwd)

printf '\n%sAll done.%s Files in %s%s%s:\n' "$C_GRN$C_BLD" "$C_OFF" "$C_BLD" "$ABS_DIR" "$C_OFF"
printf '  certificate.pem  certificate.pfx  key.pem  calm-api.env\n'
printf '\n%sHow to get a token from now on:%s\n' "$C_BLD" "$C_OFF"
printf "  curl --cert certificate.pem --key key.pem \\\\\n"
printf "       -X POST '%s/oauth/token' \\\\\n" "$CERT_URL"
printf "       -d 'grant_type=client_credentials' \\\\\n"
printf "       --data-urlencode 'client_id=%s'\n" "$CLIENT_ID"
if [ -n "$API_URL" ]; then
  printf '\n%sHow to call an API with the token:%s\n' "$C_BLD" "$C_OFF"
  printf "  curl -H 'Authorization: Bearer <access_token>' '%s/...'\n" "$API_URL"
fi
printf '\n%sKeep key.pem and certificate.pfx secret%s - they are as powerful as a password.\n' "$C_YEL" "$C_OFF"
printf 'Never commit them to Git and never send them by e-mail.\n\n'
