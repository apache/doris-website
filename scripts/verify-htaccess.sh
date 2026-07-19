#!/usr/bin/env bash
# Local verification harness for static/.htaccess. Does NOT build the site —
# only stages the dummy files needed to exercise the rewrite rules.
#
# Usage:
#   bash scripts/verify-htaccess.sh start     # boot httpd in foreground (Ctrl-C to stop)
#   bash scripts/verify-htaccess.sh test      # run curl assertions in another shell
set -euo pipefail

ROOT="${TMPDIR:-/tmp}/doris-htaccess-test"
PORT=8000
HTACCESS_SRC="$(cd "$(dirname "$0")/.." && pwd)/static/.htaccess"

stage() {
    rm -rf "$ROOT"
    mkdir -p "$ROOT"/{docs/dev/install,docs/dev/getting-started/what-is-apache-doris,zh-CN/docs/dev/getting-started/what-is-apache-doris}
    cp "$HTACCESS_SRC" "$ROOT/.htaccess"

    printf 'GENERIC_404\n' > "$ROOT/404.html"
    printf 'ZH_404\n' > "$ROOT/zh-CN/404.html"
    # Simulate a file emitted by Docusaurus build — must short-circuit the rewrite.
    printf 'EXISTING_REDIRECT_FILE\n' > "$ROOT/docs/dev/install/index.html"
    # The eventual 301 target.
    printf 'NEW_DEV_LANDING\n' > "$ROOT/docs/dev/getting-started/what-is-apache-doris/index.html"
    printf 'ZH_NEW_DEV_LANDING\n' > "$ROOT/zh-CN/docs/dev/getting-started/what-is-apache-doris/index.html"

    cat > "$ROOT/httpd.conf" <<EOF
ServerName localhost
Listen $PORT
LoadModule mpm_event_module /usr/libexec/apache2/mod_mpm_event.so
LoadModule unixd_module /usr/libexec/apache2/mod_unixd.so
LoadModule authz_core_module /usr/libexec/apache2/mod_authz_core.so
LoadModule rewrite_module /usr/libexec/apache2/mod_rewrite.so
LoadModule headers_module /usr/libexec/apache2/mod_headers.so
LoadModule dir_module /usr/libexec/apache2/mod_dir.so
LoadModule mime_module /usr/libexec/apache2/mod_mime.so
LoadModule log_config_module /usr/libexec/apache2/mod_log_config.so

TypesConfig /private/etc/apache2/mime.types
DirectoryIndex index.html

ErrorLog $ROOT/error.log
PidFile $ROOT/httpd.pid
LogLevel warn rewrite:trace3

DocumentRoot "$ROOT"
<Directory "$ROOT">
    AllowOverride All
    Require all granted
</Directory>
EOF
}

case "${1:-}" in
    start)
        stage
        echo "[stage] root: $ROOT"
        echo "[stage] running httpd on http://localhost:$PORT (Ctrl-C to stop)"
        echo "[stage] rewrite trace: tail -f $ROOT/error.log"
        exec /usr/sbin/httpd -f "$ROOT/httpd.conf" -X
        ;;
    test)
        BASE="http://localhost:$PORT"
        run() {
            local desc="$1" url="$2" want_code="$3" want_body_or_loc="$4"
            local out code loc body
            out="$(curl -sS -o "$ROOT/last-body" -w '%{http_code} %{redirect_url}' "$BASE$url")"
            code="${out%% *}"
            loc="${out#* }"
            body="$(tr -d '\r\n' < "$ROOT/last-body")"
            local got
            if [[ "$want_code" == 301 ]]; then got="$loc"; else got="$body"; fi
            if [[ "$code" == "$want_code" && "$got" == *"$want_body_or_loc"* ]]; then
                echo "PASS  $desc  -> $code"
            else
                echo "FAIL  $desc  url=$url  expected=$want_code/$want_body_or_loc  got=$code/$got"
                exit 1
            fi
        }
        run '/docs/dev/<missing>             -> 301 Dev landing'           '/docs/dev/gettingStarted/intro'   301 '/docs/dev/getting-started/what-is-apache-doris'
        run '/docs/dev/install/              -> 200 existing build file'   '/docs/dev/install/'              200 'EXISTING_REDIRECT_FILE'
        run 'zh-CN /docs/dev/<missing>       -> 301 zh-CN Dev landing'     '/zh-CN/docs/dev/whatever'         301 '/zh-CN/docs/dev/getting-started/what-is-apache-doris'
        run 'random EN 404                   -> /404.html'                 '/totally/missing/path'            404 'GENERIC_404'
        run 'random zh-CN 404                -> /zh-CN/404.html'           '/zh-CN/totally/missing/path'      404 'ZH_404'
        run '/docs/devops bystander          -> not rewritten (404)'       '/docs/devops'                     404 'GENERIC_404'
        echo 'all assertions passed'
        ;;
    *)
        echo "usage: bash $0 start|test"
        exit 2
        ;;
esac
