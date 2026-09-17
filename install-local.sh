#!/bin/bash

set -e

INSTALL_DIR=/opt/DWE_OS_2
SERVICE_NAME=dwe_os_2
SCRIPT_RUN_DIR=$PWD
TARBALL="release.tar.gz"

OFFLINE=0
WHEELHOUSE=""
TTYD_BINARY=""
DEBS_DIR=""
RECREATE_VENV=0
SKIP_REQUIREMENTS=0
USE_LOCAL_VENV=0

usage() {
    cat <<'USAGE'
Usage: install-local.sh [options] [release.tar.gz]

Installs or updates DWE OS from a release tarball that is already on this
machine. Nothing is downloaded unless the requirements step needs it.

Options:
  --offline            Do not use the network at all. apt is skipped and pip
                       installs from --wheelhouse. Use this when updating a
                       device with no internet access.
  --wheelhouse DIR     Directory of wheels to install the Python packages from
  --ttyd-binary FILE   Prebuilt ttyd binary to install if ttyd is missing
  --debs DIR           Directory of .deb packages to install before anything else
  --recreate-venv      Rebuild .venv from scratch instead of updating in place
  --skip-requirements  Do not run install_requirements.sh or create_venv.sh
  --install-dir DIR    Where to install (default: /opt/DWE_OS_2)
  --local              Developer shortcut: copy ./.venv into the install
                       directory instead of building one
  -h, --help           Show this help

The existing .venv is kept across updates unless --recreate-venv is passed, so
an offline update only has to move the wheels that actually changed.
USAGE
}

while [ $# -gt 0 ]; do
    case "$1" in
        --offline)
            OFFLINE=1
            shift
            ;;
        --wheelhouse)
            WHEELHOUSE="$2"
            shift 2
            ;;
        --ttyd-binary)
            TTYD_BINARY="$2"
            shift 2
            ;;
        --debs)
            DEBS_DIR="$2"
            shift 2
            ;;
        --recreate-venv)
            RECREATE_VENV=1
            shift
            ;;
        --skip-requirements)
            SKIP_REQUIREMENTS=1
            shift
            ;;
        --install-dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        --local)
            USE_LOCAL_VENV=1
            shift
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        -*)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
        *)
            TARBALL="$1"
            shift
            ;;
    esac
done

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "This script must be run as root"
  exit 1
fi

if [ ! -f "$TARBALL" ]; then
    echo "Error: release tarball not found: $TARBALL" >&2
    exit 1
fi
TARBALL=$(cd "$(dirname "$TARBALL")" && pwd)/$(basename "$TARBALL")

if [ -n "$WHEELHOUSE" ]; then
    WHEELHOUSE=$(cd "$WHEELHOUSE" && pwd)
fi

# Unpack somewhere temporary so the caller keeps their tarball and a failed
# install does not leave a stray release/ directory behind
WORK_DIR=$(mktemp -d)
cleanup() {
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "Extracting $TARBALL"
tar -xzf "$TARBALL" -C "$WORK_DIR"

RELEASE_DIR="$WORK_DIR/release"
if [ ! -d "$RELEASE_DIR" ]; then
    echo "Error: $TARBALL does not contain a release/ directory" >&2
    exit 1
fi

VERSION="unknown version"
if [ -f "$RELEASE_DIR/VERSION" ]; then
    VERSION=$(cat "$RELEASE_DIR/VERSION")
fi

echo "Installing DWE OS 2 ($VERSION) to $INSTALL_DIR"

# Stop the service before swapping files out from under it
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Stopping currently running $SERVICE_NAME service..."
    systemctl stop "$SERVICE_NAME"
fi

if [ -d "$INSTALL_DIR" ]; then
    if [ "$RECREATE_VENV" -eq 1 ] || [ "$USE_LOCAL_VENV" -eq 1 ]; then
        echo "$INSTALL_DIR exists, replacing it."
        rm -rf "$INSTALL_DIR"
    else
        # Keep .venv: rebuilding it needs either the network or a wheelhouse,
        # and its contents are tied to this absolute path
        echo "$INSTALL_DIR exists, updating files (keeping .venv)."
        find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 ! -name '.venv' -exec rm -rf {} +
    fi
fi

mkdir -p "$INSTALL_DIR"

cp -r "$RELEASE_DIR"/* "$INSTALL_DIR"

cd "$INSTALL_DIR"

if [ "$USE_LOCAL_VENV" -eq 1 ]; then
    echo "Copying $SCRIPT_RUN_DIR/.venv into $INSTALL_DIR"
    cp -r "$SCRIPT_RUN_DIR/.venv" "$INSTALL_DIR"
elif [ "$SKIP_REQUIREMENTS" -eq 1 ]; then
    echo "Skipping system requirements and virtual environment setup."
else
    REQUIREMENTS_ARGS=()
    VENV_ARGS=()

    if [ "$OFFLINE" -eq 1 ]; then
        REQUIREMENTS_ARGS+=(--offline)
    fi
    if [ -n "$TTYD_BINARY" ]; then
        REQUIREMENTS_ARGS+=(--ttyd-binary "$TTYD_BINARY")
    fi
    if [ -n "$DEBS_DIR" ]; then
        REQUIREMENTS_ARGS+=(--debs "$DEBS_DIR")
    fi
    if [ -n "$WHEELHOUSE" ]; then
        VENV_ARGS+=(--wheelhouse "$WHEELHOUSE")
    elif [ "$OFFLINE" -eq 1 ]; then
        echo "Error: --offline needs --wheelhouse DIR to install Python packages" >&2
        exit 1
    fi
    if [ "$RECREATE_VENV" -eq 1 ]; then
        VENV_ARGS+=(--recreate)
    fi

    bash install_requirements.sh "${REQUIREMENTS_ARGS[@]}"
    bash create_venv.sh "${VENV_ARGS[@]}"
fi

# copy and enable service
cp "$INSTALL_DIR"/service/* /etc/systemd/system/
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

cd "$SCRIPT_RUN_DIR"

echo "Successfully installed DWE OS 2 ($VERSION)"
