#!/bin/bash
#
# Updates DWE OS on a remote device over SSH. Only this machine needs internet
# access: the device is given a bundle that already contains everything, so it
# never reaches out to GitHub, PyPI or apt.
#
#   ./deploy-offline.sh pi@192.168.2.2
#
# That probes the device, builds a bundle matching it, copies the bundle over
# and runs the installer there.

set -e

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

BUNDLE=""
VERSION="latest"
RELEASE_TARBALL=""
BUILD_FROM_SOURCE=0
TARGET_ARCH=""
TARGET_PYTHON=""
TARGET_GLIBC=""
DEBS_SOURCE=""
REMOTE_DIR="/tmp"
SSH_PORT=""
SSH_IDENTITY=""
SSH_EXTRA=()
INSTALL_ARGS=()
KEEP_REMOTE=0
KEEP_BUNDLE=0
PROBE=1

usage() {
    cat <<'USAGE'
Usage: deploy-offline.sh [options] [user@]host

Updates DWE OS on a device over SSH without the device needing internet.

By default the device is probed for its architecture and Python version, a
matching bundle is built here, copied over, and installed.

Bundle:
  --bundle FILE          Use an existing bundle from package-offline.sh instead
                         of building one (skips probing)
  --version TAG          Release to package (default: latest)
  --release-tarball FILE Package a release.tar.gz that is already on disk
  --build-from-source    Build the release from this checkout
  --debs DIR             .deb packages to carry along to the device
  --keep-bundle          Keep the bundle that was built (default: discard it)

Target overrides (skip probing the device):
  --no-probe             Do not ask the device what it is
  --arch ARCH            x86_64 | aarch64 | armv7l
  --python VERSION       Target Python minor version, e.g. 3.11
  --glibc VERSION        Target glibc version, e.g. 2.36

SSH:
  --port N               SSH port
  --identity FILE        SSH private key
  --ssh-option OPT       Extra ssh -o option (repeatable)
  --remote-dir DIR       Where to stage the bundle on the device (default: /tmp)
  --keep-remote          Leave the bundle on the device after installing

Install:
  --install-arg ARG      Extra argument for install-offline.sh (repeatable),
                         e.g. --install-arg --recreate-venv
  -h, --help             Show this help

Examples:
  ./deploy-offline.sh pi@192.168.2.2
  ./deploy-offline.sh --version v0.7.4 --identity ~/.ssh/id_dwe pi@192.168.2.2
  ./deploy-offline.sh --build-from-source --install-arg --recreate-venv pi@dwe.local
USAGE
}

while [ $# -gt 0 ]; do
    case "$1" in
        --bundle)
            BUNDLE="$2"
            shift 2
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --release-tarball)
            RELEASE_TARBALL="$2"
            shift 2
            ;;
        --build-from-source)
            BUILD_FROM_SOURCE=1
            shift
            ;;
        --debs)
            DEBS_SOURCE="$2"
            shift 2
            ;;
        --keep-bundle)
            KEEP_BUNDLE=1
            shift
            ;;
        --no-probe)
            PROBE=0
            shift
            ;;
        --arch)
            TARGET_ARCH="$2"
            shift 2
            ;;
        --python)
            TARGET_PYTHON="$2"
            shift 2
            ;;
        --glibc)
            TARGET_GLIBC="$2"
            shift 2
            ;;
        --port)
            SSH_PORT="$2"
            shift 2
            ;;
        --identity)
            SSH_IDENTITY="$2"
            shift 2
            ;;
        --ssh-option)
            SSH_EXTRA+=(-o "$2")
            shift 2
            ;;
        --remote-dir)
            REMOTE_DIR="$2"
            shift 2
            ;;
        --keep-remote)
            KEEP_REMOTE=1
            shift
            ;;
        --install-arg)
            INSTALL_ARGS+=("$2")
            shift 2
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
            if [ -n "${REMOTE_TARGET:-}" ]; then
                echo "Error: more than one host given ($REMOTE_TARGET, $1)" >&2
                exit 1
            fi
            REMOTE_TARGET="$1"
            shift
            ;;
    esac
done

if [ -z "${REMOTE_TARGET:-}" ]; then
    echo "Error: no host given" >&2
    usage >&2
    exit 1
fi

SSH_ARGS=()
SCP_ARGS=()
if [ -n "$SSH_PORT" ]; then
    SSH_ARGS+=(-p "$SSH_PORT")
    SCP_ARGS+=(-P "$SSH_PORT")
fi
if [ -n "$SSH_IDENTITY" ]; then
    SSH_ARGS+=(-i "$SSH_IDENTITY")
    SCP_ARGS+=(-i "$SSH_IDENTITY")
fi
SSH_ARGS+=("${SSH_EXTRA[@]}")
SCP_ARGS+=("${SSH_EXTRA[@]}")

run_ssh() {
    ssh "${SSH_ARGS[@]}" "$REMOTE_TARGET" "$@"
}

# Single-quote a value for the remote shell
quote_remote() {
    printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"
}

# ------------------------------------------------------------------- probing

REMOTE_IS_ROOT=0

# Emitted as key=value so a command that produces no output on the device
# cannot shift the rest of the answers
PROBE_CMD=$(cat <<'PROBE'
echo "arch=$(uname -m)"
echo "python=$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])' 2>/dev/null)"
echo "glibc=$(getconf GNU_LIBC_VERSION 2>/dev/null | cut -d" " -f2)"
echo "uid=$(id -u)"
PROBE
)

probe_value() {
    printf '%s\n' "$PROBE_OUTPUT" | sed -n "s/^$1=//p"
}

if [ "$PROBE" -eq 1 ] && [ -z "$BUNDLE" ]; then
    echo "Probing $REMOTE_TARGET..."
    PROBE_OUTPUT=$(run_ssh "$PROBE_CMD")

    PROBED_ARCH=$(probe_value arch)
    PROBED_PYTHON=$(probe_value python)
    PROBED_GLIBC=$(probe_value glibc)
    PROBED_UID=$(probe_value uid)

    echo "  architecture: $PROBED_ARCH"
    echo "  python:       ${PROBED_PYTHON:-not found}"
    echo "  glibc:        ${PROBED_GLIBC:-unknown}"

    if [ -z "$PROBED_PYTHON" ]; then
        echo "Error: no python3 on $REMOTE_TARGET. DWE OS needs python3 and" >&2
        echo "python3-venv installed on the device before it can be updated offline." >&2
        exit 1
    fi

    [ -z "$TARGET_ARCH" ] && TARGET_ARCH="$PROBED_ARCH"
    [ -z "$TARGET_PYTHON" ] && TARGET_PYTHON="$PROBED_PYTHON"
    if [ -z "$TARGET_GLIBC" ] && echo "$PROBED_GLIBC" | grep -qE '^[0-9]+\.[0-9]+$'; then
        TARGET_GLIBC="$PROBED_GLIBC"
    fi
    [ "$PROBED_UID" = "0" ] && REMOTE_IS_ROOT=1
else
    PROBE_OUTPUT=$(run_ssh "$PROBE_CMD")
    [ "$(probe_value uid)" = "0" ] && REMOTE_IS_ROOT=1
fi

# ------------------------------------------------------------ build the bundle

BUILT_BUNDLE=""

if [ -z "$BUNDLE" ]; then
    PACKAGE_ARGS=()
    [ -n "$TARGET_ARCH" ] && PACKAGE_ARGS+=(--arch "$TARGET_ARCH")
    [ -n "$TARGET_PYTHON" ] && PACKAGE_ARGS+=(--python "$TARGET_PYTHON")
    [ -n "$TARGET_GLIBC" ] && PACKAGE_ARGS+=(--glibc "$TARGET_GLIBC")
    [ -n "$DEBS_SOURCE" ] && PACKAGE_ARGS+=(--debs "$DEBS_SOURCE")

    if [ "$BUILD_FROM_SOURCE" -eq 1 ]; then
        PACKAGE_ARGS+=(--build-from-source)
    elif [ -n "$RELEASE_TARBALL" ]; then
        PACKAGE_ARGS+=(--release-tarball "$RELEASE_TARBALL")
    else
        PACKAGE_ARGS+=(--version "$VERSION")
    fi

    if [ "$KEEP_BUNDLE" -eq 1 ]; then
        BUNDLE_OUT="$PWD/dweos-offline-${TARGET_ARCH}-py${TARGET_PYTHON}.tar.gz"
    else
        BUNDLE_STAGE=$(mktemp -d)
        BUNDLE_OUT="$BUNDLE_STAGE/dweos-offline.tar.gz"
        trap 'rm -rf "$BUNDLE_STAGE"' EXIT
    fi

    echo
    PACKAGE_HIDE_HINTS=1 bash "$SCRIPT_DIR/package-offline.sh" "${PACKAGE_ARGS[@]}" --output "$BUNDLE_OUT"
    BUNDLE="$BUNDLE_OUT"
    BUILT_BUNDLE="$BUNDLE_OUT"
fi

if [ ! -f "$BUNDLE" ]; then
    echo "Error: bundle not found: $BUNDLE" >&2
    exit 1
fi

# ------------------------------------------------------------------- transfer

BUNDLE_NAME=$(basename "$BUNDLE")
REMOTE_BUNDLE="$REMOTE_DIR/$BUNDLE_NAME"
REMOTE_STAGE="$REMOTE_DIR/dweos-offline"

echo
echo "Copying $BUNDLE_NAME to $REMOTE_TARGET:$REMOTE_DIR ..."
scp "${SCP_ARGS[@]}" "$BUNDLE" "$REMOTE_TARGET:$REMOTE_BUNDLE"

if [ "$REMOTE_IS_ROOT" -eq 1 ]; then
    SUDO_PREFIX=""
else
    SUDO_PREFIX="sudo "
fi

REMOTE_INSTALL_ARGS=""
for arg in "${INSTALL_ARGS[@]}"; do
    REMOTE_INSTALL_ARGS="$REMOTE_INSTALL_ARGS $(quote_remote "$arg")"
done

REMOTE_SCRIPT="set -e
rm -rf $(quote_remote "$REMOTE_STAGE")
tar -xzf $(quote_remote "$REMOTE_BUNDLE") -C $(quote_remote "$REMOTE_DIR")
${SUDO_PREFIX}bash $(quote_remote "$REMOTE_STAGE/install-offline.sh")$REMOTE_INSTALL_ARGS"

if [ "$KEEP_REMOTE" -eq 0 ]; then
    REMOTE_SCRIPT="$REMOTE_SCRIPT
rm -rf $(quote_remote "$REMOTE_STAGE") $(quote_remote "$REMOTE_BUNDLE")"
fi

echo
echo "Installing on $REMOTE_TARGET ..."
echo

# -t so sudo can prompt for a password on the device
ssh -t "${SSH_ARGS[@]}" "$REMOTE_TARGET" "$REMOTE_SCRIPT"

echo
echo "Done. DWE OS updated on $REMOTE_TARGET."
if [ "$KEEP_BUNDLE" -eq 1 ] && [ -n "$BUILT_BUNDLE" ]; then
    echo "Bundle kept at $BUILT_BUNDLE"
fi
