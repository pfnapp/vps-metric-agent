#!/usr/bin/env bash
set -euo pipefail

REPO="pfnapp/vps-metric-agent"
BINARY_NAME="vps-metric-agent"
MODE="user" # user|system
VERSION="latest"
INSTALL_DIR=""

usage() {
  cat <<'EOF'
Install vps-metric-agent binary from GitHub Releases.

Usage:
  ./install.sh [options]

Options:
  --user               Install to ~/.local/bin (default, no root needed)
  --system             Install to /usr/local/bin (requires root or sudo)
  --version <tag>      Install specific tag (e.g. v0.2.0). Default: latest
  --dir <path>         Custom install directory
  -h, --help           Show this help

Examples:
  ./install.sh
  ./install.sh --system
  ./install.sh --version v0.2.0 --user
  ./install.sh --dir /opt/bin
EOF
}

log() {
  printf '[install] %s\n' "$*"
}

err() {
  printf '[install][error] %s\n' "$*" >&2
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    err "Required command not found: $1"
    exit 1
  }
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --user)
        MODE="user"
        shift
        ;;
      --system)
        MODE="system"
        shift
        ;;
      --version)
        VERSION="${2:-}"
        [[ -n "$VERSION" ]] || { err "--version requires value"; exit 1; }
        shift 2
        ;;
      --dir)
        INSTALL_DIR="${2:-}"
        [[ -n "$INSTALL_DIR" ]] || { err "--dir requires value"; exit 1; }
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        err "Unknown argument: $1"
        usage
        exit 1
        ;;
    esac
  done
}

detect_asset_name() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Linux) os_part="linux" ;;
    Darwin) os_part="darwin" ;;
    *) err "Unsupported OS: $os"; exit 1 ;;
  esac

  case "$arch" in
    x86_64|amd64) arch_part="x64" ;;
    aarch64|arm64) arch_part="arm64" ;;
    *) err "Unsupported architecture: $arch"; exit 1 ;;
  esac

  printf '%s-%s-%s' "$BINARY_NAME" "$os_part" "$arch_part"
}

resolve_install_dir() {
  if [[ -n "$INSTALL_DIR" ]]; then
    printf '%s' "$INSTALL_DIR"
    return
  fi

  if [[ "$MODE" == "system" ]]; then
    printf '/usr/local/bin'
  else
    printf '%s/.local/bin' "$HOME"
  fi
}

get_download_url() {
  local asset_name api_url tag json_line
  asset_name="$1"

  if [[ "$VERSION" == "latest" ]]; then
    api_url="https://api.github.com/repos/${REPO}/releases/latest"
  else
    tag="${VERSION#refs/tags/}"
    api_url="https://api.github.com/repos/${REPO}/releases/tags/${tag}"
  fi

  if command -v jq >/dev/null 2>&1; then
    curl -fsSL "$api_url" | jq -r --arg ASSET "$asset_name" '.assets[] | select(.name == $ASSET) | .browser_download_url' | head -n1
  else
    # fallback without jq
    json_line="$(curl -fsSL "$api_url" | tr -d '\n' | sed 's/},{/},\n{/g' | grep "\"name\":\"${asset_name}\"" | head -n1 || true)"
    if [[ -n "$json_line" ]]; then
      printf '%s' "$json_line" | sed -n 's/.*"browser_download_url":"\([^"]*\)".*/\1/p' | sed 's#\\/#/#g'
    fi
  fi
}

download_and_install() {
  local asset_name url target_dir tmp_file final_path
  asset_name="$(detect_asset_name)"
  target_dir="$(resolve_install_dir)"
  final_path="${target_dir}/${BINARY_NAME}"

  log "Detected asset: ${asset_name}"
  log "Resolving release URL (${VERSION})..."

  url="$(get_download_url "$asset_name")"
  if [[ -z "$url" || "$url" == "null" ]]; then
    err "Release asset not found for ${asset_name} (version: ${VERSION})"
    err "Check available release assets: https://github.com/${REPO}/releases"
    exit 1
  fi

  log "Download URL: ${url}"

  tmp_file="$(mktemp)"
  trap 'rm -f "$tmp_file"' EXIT

  log "Downloading binary..."
  curl -fL "$url" -o "$tmp_file"

  if [[ "$MODE" == "system" ]]; then
    if [[ "$EUID" -ne 0 ]]; then
      need_cmd sudo
      log "Installing to ${target_dir} with sudo"
      sudo mkdir -p "$target_dir"
      sudo install -m 0755 "$tmp_file" "$final_path"
    else
      mkdir -p "$target_dir"
      install -m 0755 "$tmp_file" "$final_path"
    fi
  else
    mkdir -p "$target_dir"
    install -m 0755 "$tmp_file" "$final_path"

    case ":$PATH:" in
      *":${target_dir}:"*) : ;;
      *)
        log "${target_dir} is not in PATH. Add this to your shell profile:"
        log "  export PATH=\"${target_dir}:\$PATH\""
        ;;
    esac
  fi

  log "Installed: ${final_path}"
  log "Done. Try: ${BINARY_NAME} --help || ${BINARY_NAME}"
}

main() {
  need_cmd curl
  parse_args "$@"
  download_and_install
}

main "$@"
