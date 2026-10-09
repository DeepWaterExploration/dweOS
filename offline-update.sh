#!/bin/bash
#
# Updates DWE OS on a device that has no internet access, over SSH.
#
#   ./offline-update.sh pi@192.168.2.2
#
# Run it from a machine that *does* have internet. It asks the device what it
# is, collects the release and every Python wheel that release needs, ships the
# lot over, and installs it. The device makes no outbound connection.
#
# This only updates a device DWE OS is already installed on: apt is never run,
# so GStreamer, python3-venv and ttyd have to be there already (they come with
# the initial install and the Pi image).

set -e

GITHUB_REPO="${GITHUB_REPO:-DeepwaterExploration/DWE_OS_2}"

VERSION="latest"
RELEASE_TARBALL=""
ARCH=""
PYTHON=""
GLIBC_MINOR=""
PACK_ONLY=""
SSH_ARGS=()
SCP_ARGS=()
HOST=""

usage() {
    cat <<'USAGE'
Usage: offline-update.sh [options] [user@]host

Updates DWE OS on a device with no internet access, over SSH. Run from a
machine that has internet.

Options:
  --version TAG            Release to install (default: latest)
  --release-tarball FILE   Install a release.tar.gz already on disk, e.g. one
                           you just built with ./create_release.sh
  --pack-only FILE         Write the bundle to FILE and stop, for when the
                           device is not reachable from here either. Needs
                           --arch and --python, since there is nothing to probe.
  --arch ARCH              Device architecture: x86_64, aarch64 or armv7l
  --python VERSION         Device Python version, e.g. 3.11
  --port N                 SSH port
  --identity FILE          SSH private key
  -h, --help               Show this help

To install a bundle by hand (USB stick, serial console, whatever):
  tar -xzf dwe-update.tar.gz
  sudo ./dwe-update/install.sh

Read --arch and --python off the device with:
  uname -m
  python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])'
USAGE
}

while [ $# -gt 0 ]; do
    case "$1" in
        --version) VERSION="$2"; shift 2 ;;
        --release-tarball) RELEASE_TARBALL="$2"; shift 2 ;;
        --pack-only) PACK_ONLY="$2"; shift 2 ;;
        --arch) ARCH="$2"; shift 2 ;;
        --python) PYTHON="$2"; shift 2 ;;
        --port) SSH_ARGS+=(-p "$2"); SCP_ARGS+=(-P "$2"); shift 2 ;;
        --identity) SSH_ARGS+=(-i "$2"); SCP_ARGS+=(-i "$2"); shift 2 ;;
        -h | --help) usage; exit 0 ;;
        -*) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
        *) HOST="$1"; shift ;;
    esac
done

if [ -z "$HOST" ] && [ -z "$PACK_ONLY" ]; then
    echo "Error: no host given" >&2
    usage >&2
    exit 1
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
BUNDLE="$WORK/dwe-update"
mkdir -p "$BUNDLE/wheelhouse"

# ----------------------------------------------------------- what the device is

# key=value, so a command that prints nothing on the device cannot shift the
# answers that follow it
PROBE=$(cat <<'PROBE_EOF'
echo "arch=$(uname -m)"
echo "python=$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])' 2>/dev/null)"
echo "glibc=$(getconf GNU_LIBC_VERSION 2>/dev/null | cut -d" " -f2)"
PROBE_EOF
)

if [ -n "$HOST" ] && { [ -z "$ARCH" ] || [ -z "$PYTHON" ]; }; then
    echo "Asking $HOST what it is..."
    PROBED=$(ssh "${SSH_ARGS[@]}" "$HOST" "$PROBE")
    [ -z "$ARCH" ] && ARCH=$(printf '%s\n' "$PROBED" | sed -n 's/^arch=//p')
    [ -z "$PYTHON" ] && PYTHON=$(printf '%s\n' "$PROBED" | sed -n 's/^python=//p')
    GLIBC_MINOR=$(printf '%s\n' "$PROBED" | sed -n 's/^glibc=2\.//p')
fi

if [ -z "$ARCH" ] || [ -z "$PYTHON" ]; then
    echo "Error: could not work out the device's architecture and Python version." >&2
    echo "Pass --arch and --python, or check that python3 is installed on the device." >&2
    exit 1
fi

case "$ARCH" in
    x86_64 | amd64) ARCH=x86_64 ;;
    aarch64 | arm64) ARCH=aarch64 ;;
    armv7l | armhf) ARCH=armv7l ;;
    *) echo "Error: unsupported architecture: $ARCH" >&2; exit 1 ;;
esac

# Only pick wheels the device's glibc can actually load. 2.28 covers Debian
# bullseye and newer when we could not ask.
echo "$GLIBC_MINOR" | grep -qE '^[0-9]+$' || GLIBC_MINOR=28
[ "$GLIBC_MINOR" -lt 17 ] && GLIBC_MINOR=17

echo "Device: $ARCH, Python $PYTHON, glibc 2.$GLIBC_MINOR"

# ------------------------------------------------------------------ the release

if [ -n "$RELEASE_TARBALL" ]; then
    cp "$RELEASE_TARBALL" "$BUNDLE/release.tar.gz"
else
    if [ "$VERSION" = latest ]; then
        URL="https://github.com/$GITHUB_REPO/releases/latest/download/release.tar.gz"
    else
        URL="https://github.com/$GITHUB_REPO/releases/download/$VERSION/release.tar.gz"
    fi
    echo "Downloading release ($VERSION)..."
    curl -fL --progress-bar -o "$BUNDLE/release.tar.gz" "$URL"
fi

tar -xzf "$BUNDLE/release.tar.gz" -C "$WORK" release/backend_py/requirements.txt
REQUIREMENTS="$WORK/release/backend_py/requirements.txt"

# ------------------------------------------------------------------- the wheels

# A distribution-patched system pip can fail to build source distributions that
# build fine in a clean environment, so use a throwaway venv
python3 -m venv "$WORK/buildenv" >/dev/null
PIP="$WORK/buildenv/bin/pip"
"$PIP" install --quiet --upgrade pip setuptools wheel

TAGS=()
for minor in $(seq "$GLIBC_MINOR" -1 17); do
    TAGS+=(--platform "manylinux_2_${minor}_${ARCH}")
done
TAGS+=(--platform "manylinux2014_${ARCH}" --platform "linux_${ARCH}" --platform any)

LOG="$WORK/pip.log"
download_wheels() {
    "$PIP" download -r "$REQUIREMENTS" -d "$BUNDLE/wheelhouse" \
        --find-links "$BUNDLE/wheelhouse" --only-binary=:all: "${TAGS[@]}" \
        --python-version "$PYTHON" --implementation cp \
        --abi "cp${PYTHON//./}" --abi abi3 --abi none \
        --retries 5 --timeout 60 >"$LOG" 2>&1
}

echo "Collecting wheels for $ARCH / Python $PYTHON..."

# pip can only cross-select wheels, never build them, so a dependency that
# publishes no wheel at all has to be built here. Keep it only if it came out
# architecture independent, since anything else would be a wheel for this
# machine rather than for the device.
attempt=0
until download_wheels; do
    MISSING=$(sed -n 's/^ERROR: No matching distribution found for //p' "$LOG" | head -1)
    attempt=$((attempt + 1))
    if [ -z "$MISSING" ] || [ "$attempt" -gt 15 ]; then
        tail -n 20 "$LOG" >&2
        echo "Error: could not collect the Python wheels" >&2
        exit 1
    fi

    echo "  $MISSING publishes no wheel, building one..."
    rm -rf "$WORK/build" && mkdir -p "$WORK/build"
    "$PIP" download --no-deps --no-binary :all: "$MISSING" -d "$WORK/build" >>"$LOG" 2>&1
    "$PIP" wheel --no-deps "$WORK"/build/* -w "$WORK/build" >>"$LOG" 2>&1

    for wheel in "$WORK"/build/*.whl; do
        case "$wheel" in
            *-none-any.whl) mv "$wheel" "$BUNDLE/wheelhouse/" ;;
            *)
                echo "Error: $MISSING builds into something specific to this machine." >&2
                echo "Build the bundle on a $ARCH machine instead (--pack-only)." >&2
                exit 1
                ;;
        esac
    done
done

echo "Wheelhouse: $(find "$BUNDLE/wheelhouse" -name '*.whl' | wc -l) wheels"

# ------------------------------------------------------------- device installer

cat > "$BUNDLE/install.sh" <<INSTALLER
#!/bin/bash
#
# Installs the update sitting next to this script. Nothing here uses the
# network. Run as root on the device:  sudo ./install.sh

set -e

INSTALL_DIR=\${INSTALL_DIR:-/opt/DWE_OS_2}
BUNDLE=\$(cd -- "\$(dirname -- "\${BASH_SOURCE[0]}")" &>/dev/null && pwd)

[ "\$EUID" -eq 0 ] || { echo "This script must be run as root" >&2; exit 1; }

# These wheels were picked for one architecture and one Python version.
# Anywhere else they install cleanly and then fail at import time.
DEVICE_PYTHON=\$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])')
[ "\$(uname -m)" = "$ARCH" ] || { echo "This bundle is for $ARCH, not \$(uname -m)" >&2; exit 1; }
[ "\$DEVICE_PYTHON" = "$PYTHON" ] || { echo "This bundle is for Python $PYTHON, not \$DEVICE_PYTHON" >&2; exit 1; }

systemctl stop dwe_os_2 2>/dev/null || true

TMP=\$(mktemp -d)
trap 'rm -rf "\$TMP"' EXIT
tar -xzf "\$BUNDLE/release.tar.gz" -C "\$TMP"

# Keep .venv. Rebuilding it needs the wheelhouse anyway, and its contents are
# tied to this absolute path.
mkdir -p "\$INSTALL_DIR"
find "\$INSTALL_DIR" -mindepth 1 -maxdepth 1 ! -name .venv -exec rm -rf {} +
cp -r "\$TMP"/release/* "\$INSTALL_DIR"

[ -x "\$INSTALL_DIR/.venv/bin/pip" ] || python3 -m venv "\$INSTALL_DIR/.venv"
"\$INSTALL_DIR/.venv/bin/pip" install --no-index --find-links "\$BUNDLE/wheelhouse" \\
    --upgrade -r "\$INSTALL_DIR/backend_py/requirements.txt"

cp "\$INSTALL_DIR"/service/* /etc/systemd/system/
systemctl daemon-reload
systemctl enable dwe_os_2
systemctl restart dwe_os_2

echo "DWE OS updated."
INSTALLER
chmod +x "$BUNDLE/install.sh"

# ------------------------------------------------------------------- ship it

if [ -n "$PACK_ONLY" ]; then
    tar -czf "$PACK_ONLY" -C "$WORK" dwe-update
    echo
    echo "Bundle written to $PACK_ONLY ($(du -h "$PACK_ONLY" | cut -f1))"
    echo "On the device:  tar -xzf $(basename "$PACK_ONLY") && sudo ./dwe-update/install.sh"
    exit 0
fi

tar -czf "$WORK/dwe-update.tar.gz" -C "$WORK" dwe-update

echo
echo "Copying to $HOST..."
scp "${SCP_ARGS[@]}" "$WORK/dwe-update.tar.gz" "$HOST:/tmp/dwe-update.tar.gz"

echo "Installing..."
echo
# -t so sudo can prompt for a password on the device
ssh -t "${SSH_ARGS[@]}" "$HOST" '
set -e
cd /tmp
rm -rf dwe-update
tar -xzf dwe-update.tar.gz
if [ "$(id -u)" = 0 ]; then ./dwe-update/install.sh; else sudo ./dwe-update/install.sh; fi
rm -rf dwe-update dwe-update.tar.gz'
