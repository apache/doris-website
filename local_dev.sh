#!/usr/bin/env bash
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

##############################################################
# Local development script for doris-website
#
# Usage:
#   ./local_dev.sh [command] [options]
#
# Commands:
#   start       Start dev server (English, default)
#   start-zh    Start dev server (Chinese)
#   build       Full production build (en + zh-CN)
#   build-en    Production build (English only)
#   serve       Serve a previous production build
#   install     Install dependencies only
#   clean       Clean build artifacts and caches
#   help        Show this help message
#
# Options:
#   --port PORT         Dev server port (default: 3000)
#   --host HOST         Dev server host (default: localhost)
#   --skip-install      Skip yarn install step
#   --versions LIST     Comma-separated versions to build
#                       e.g. --versions "4.x" (faster builds)
#   --max-mem MB        Node.js max old space size in MB
#                       (default: 8192)
#
# Examples:
#   ./local_dev.sh                        # start English dev server
#   ./local_dev.sh start --port 8080      # start on port 8080
#   ./local_dev.sh start-zh               # start Chinese dev server
#   ./local_dev.sh build-en               # build English only
#   ./local_dev.sh build                  # full build (slow)
#   ./local_dev.sh build --versions "4.x" # build only 4.x version
#   ./local_dev.sh clean                  # clean caches
##############################################################

set -euo pipefail

# ─── Resolve project root (directory of this script) ─────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"

# ─── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }
step()  { echo -e "\n${CYAN}${BOLD}==> $*${NC}"; }

# ─── Discover Node.js and Yarn (no global env modification) ──
setup_node_env() {
    # Try common Node.js install locations (macOS + Linux)
    local search_paths=(
        "/usr/local/bin"
        "/usr/bin"
        "/opt/homebrew/bin"
        "${HOME}/.nvm/versions/node/$(ls -1 ${HOME}/.nvm/versions/node/ 2>/dev/null | sort -V | tail -1)/bin"
        "${HOME}/.volta/bin"
        "${HOME}/.fnm/aliases/default/bin"
        "${HOME}/.local/bin"
        "/snap/node/current/bin"
    )

    # If node is already on PATH, no need to modify
    if command -v node &>/dev/null && command -v yarn &>/dev/null; then
        NODE_BIN="$(command -v node)"
        YARN_BIN="$(command -v yarn)"
        return 0
    fi

    # Search for node in common locations
    local found_path=""
    for p in "${search_paths[@]}"; do
        if [[ -x "${p}/node" ]]; then
            found_path="${p}"
            break
        fi
    done

    if [[ -z "${found_path}" ]]; then
        error "Node.js not found! Please install Node.js >= 18."
        error "Searched: ${search_paths[*]}"
        echo ""
        echo "Install options:"
        echo "  macOS:  brew install node"
        echo "  Linux:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
        echo "  or visit https://nodejs.org/"
        exit 1
    fi

    # Prepend to PATH only within this script's process
    export PATH="${found_path}:${PATH}"
    NODE_BIN="${found_path}/node"

    # Ensure yarn is available; install locally if needed
    if [[ -x "${found_path}/yarn" ]]; then
        YARN_BIN="${found_path}/yarn"
    elif command -v yarn &>/dev/null; then
        YARN_BIN="$(command -v yarn)"
    else
        warn "Yarn not found, installing via npm (local to this script)..."
        "${found_path}/npm" install -g yarn 2>/dev/null || {
            error "Failed to install yarn. Please install manually: npm install -g yarn"
            exit 1
        }
        YARN_BIN="${found_path}/yarn"
    fi
}

# ─── Validate environment ───────────────────────────────────
validate_env() {
    step "Checking environment"

    setup_node_env

    local node_version
    node_version="$("${NODE_BIN}" --version)"
    local node_major="${node_version#v}"
    node_major="${node_major%%.*}"

    if (( node_major < 18 )); then
        error "Node.js >= 18 is required, found ${node_version}"
        exit 1
    fi

    local yarn_version
    yarn_version="$("${YARN_BIN}" --version)"

    ok "Node.js ${node_version} (${NODE_BIN})"
    ok "Yarn    v${yarn_version} (${YARN_BIN})"
    ok "Project ${PROJECT_ROOT}"
}

# ─── Install dependencies ───────────────────────────────────
do_install() {
    step "Installing dependencies"
    cd "${PROJECT_ROOT}"

    if [[ -d "node_modules" ]] && [[ -f "node_modules/.yarn-integrity" ]]; then
        info "node_modules exists, running yarn to sync..."
    else
        info "Installing from scratch (this may take a few minutes)..."
    fi

    "${YARN_BIN}" install --frozen-lockfile 2>/dev/null || "${YARN_BIN}" install
    ok "Dependencies installed"
}

# ─── Set DOCS_VERSIONS env var for selective version builds ──
# This uses the onlyIncludeVersions option in docusaurus.config.js
# instead of modifying versions.json (which is fragile).
apply_versions_env() {
    local filter="$1"
    if [[ -n "${filter}" ]]; then
        export DOCS_VERSIONS="${filter}"
        info "DOCS_VERSIONS=${filter} (only these versions will be built)"
    else
        info "DOCS_VERSIONS not set (all versions will be built)"
    fi
}

# ─── Commands ────────────────────────────────────────────────

cmd_start() {
    local port="${OPT_PORT}"
    local host="${OPT_HOST}"

    validate_env
    if [[ "${OPT_SKIP_INSTALL}" != "true" ]]; then
        do_install
    fi

    apply_versions_env "${OPT_VERSIONS}"
    export NODE_OPTIONS="--max-old-space-size=${OPT_MAX_MEM}"

    step "Starting dev server (English) on ${host}:${port}"
    info "Press Ctrl+C to stop"
    echo ""

    cd "${PROJECT_ROOT}"
    "${YARN_BIN}" docusaurus start --no-open --host "${host}" --port "${port}"
}

cmd_start_zh() {
    local port="${OPT_PORT}"
    local host="${OPT_HOST}"

    validate_env
    if [[ "${OPT_SKIP_INSTALL}" != "true" ]]; then
        do_install
    fi

    apply_versions_env "${OPT_VERSIONS}"
    export NODE_OPTIONS="--max-old-space-size=${OPT_MAX_MEM}"

    step "Starting dev server (Chinese) on ${host}:${port}"
    info "Press Ctrl+C to stop"
    echo ""

    cd "${PROJECT_ROOT}"
    "${YARN_BIN}" docusaurus start --no-open --locale zh-CN --host "${host}" --port "${port}"
}

cmd_build() {
    local locales="${1:-en}"

    validate_env
    if [[ "${OPT_SKIP_INSTALL}" != "true" ]]; then
        do_install
    fi

    apply_versions_env "${OPT_VERSIONS}"

    step "Building site (locales: ${locales})"
    info "NODE_OPTIONS=--max-old-space-size=${OPT_MAX_MEM}"
    info "This may take 10-30 minutes for full builds..."
    echo ""

    cd "${PROJECT_ROOT}"
    export NODE_OPTIONS="--max-old-space-size=${OPT_MAX_MEM}"

    # Build locale arguments
    local locale_args=""
    for locale in ${locales}; do
        locale_args+=" --locale ${locale}"
    done

    "${YARN_BIN}" docusaurus build ${locale_args}

    ok "Build completed! Output in: ${PROJECT_ROOT}/build/"
    info "Run './local_dev.sh serve' to preview the build."
}

cmd_serve() {
    validate_env

    if [[ ! -d "${PROJECT_ROOT}/build" ]]; then
        error "No build directory found. Run './local_dev.sh build' first."
        exit 1
    fi

    local port="${OPT_PORT}"
    local host="${OPT_HOST}"

    step "Serving build on ${host}:${port}"
    info "Press Ctrl+C to stop"
    echo ""

    cd "${PROJECT_ROOT}"
    "${YARN_BIN}" docusaurus serve --host "${host}" --port "${port}"
}

cmd_clean() {
    step "Cleaning build artifacts and caches"

    cd "${PROJECT_ROOT}"

    local dirs_to_clean=("build" ".docusaurus" "node_modules/.cache")
    for d in "${dirs_to_clean[@]}"; do
        if [[ -d "${d}" ]]; then
            info "Removing ${d}/"
            rm -rf "${d}"
        fi
    done

    ok "Clean completed"
    info "Run './local_dev.sh install' to reinstall dependencies if needed."
}

cmd_install() {
    validate_env
    do_install
}

cmd_help() {
    # Print the header comments of this script
    sed -n '/^##*$/,/^##*$/p' "${BASH_SOURCE[0]}" | head -40
    echo ""
    echo -e "${BOLD}Quick start:${NC}"
    echo "  ./local_dev.sh              # Start English dev server"
    echo "  ./local_dev.sh start-zh     # Start Chinese dev server"
    echo "  ./local_dev.sh build        # Build English only (default)"
    echo "  ./local_dev.sh build-all    # Full production build (en + zh-CN)"
    echo ""
}

# ─── Parse arguments ─────────────────────────────────────────

COMMAND="${1:-start}"
shift 2>/dev/null || true

OPT_PORT="3000"
OPT_HOST="localhost"
OPT_SKIP_INSTALL="false"
OPT_VERSIONS="current"
OPT_MAX_MEM="2048"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --port)
            OPT_PORT="$2"; shift 2 ;;
        --host)
            OPT_HOST="$2"; shift 2 ;;
        --skip-install)
            OPT_SKIP_INSTALL="true"; shift ;;
        --versions)
            OPT_VERSIONS="$2"; shift 2 ;;
        --max-mem)
            OPT_MAX_MEM="$2"; shift 2 ;;
        -h|--help)
            COMMAND="help"; shift ;;
        *)
            error "Unknown option: $1"
            cmd_help
            exit 1 ;;
    esac
done

# ─── Dispatch command ────────────────────────────────────────
case "${COMMAND}" in
    start)      cmd_start ;;
    start-zh)   cmd_start_zh ;;
    build)      cmd_build "en" ;;
    build-all)  cmd_build "en zh-CN" ;;
    build-en)   cmd_build "en" ;;
    serve)      cmd_serve ;;
    install)    cmd_install ;;
    clean)      cmd_clean ;;
    help|-h|--help) cmd_help ;;
    *)
        error "Unknown command: ${COMMAND}"
        cmd_help
        exit 1 ;;
esac
