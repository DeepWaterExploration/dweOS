#!/bin/bash
#
# Builds a self-contained bundle that installs or updates DWE OS on a device
# with no internet access. Run this on a machine that *does* have internet,
# then ship the bundle to the device (deploy-offline.sh does that over SSH).
#
# The bundle carries the release tarball, every Python wheel needed for the
# target's architecture and Python version, a matching ttyd binary, and the
# installer itself.

set -e

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

GITHUB_REPO="${GITHUB_REPO:-DeepwaterExploration/DWE_OS_2}"
TTYD_VERSION="1.6.3"

# Oldest glibc any manylinux wheel we pick may require. Bumping the ceiling to
# whatever the device actually has (--glibc, or the probe in deploy-offline.sh)
# widens the set of wheels we can use.
MIN_GLIBC_MINOR=17
DEFAULT_GLIBC_MINOR=28

VERSION="latest"
RELEASE_TARBALL=""
BUILD_FROM_SOURCE=0
TARGET_ARCH=""
TARGET_PYTHON=""
TARGET_GLIBC=""
OUTPUT=""
SKIP_TTYD=0
DEBS_SOURCE=""

usage() {
    cat <<'USAGE'
Usage: package-offline.sh [options]

Builds an offline install/update bundle for a device with no internet access.
Run this on a machine that has internet.

Release source (pick one, default --version latest):
  --version TAG          Download this release from GitHub (e.g. v0.7.4, latest)
  --release-tarball FILE Use a release.tar.gz that is already on disk
  --build-from-source    Run ./create_release.sh to build the release here

Target description (what the device is, not what this machine is):
  --arch ARCH            x86_64 | aarch64 | armv7l (default: this machine's)
  --python VERSION       Target Python minor version, e.g. 3.11 (default: this
                         machine's). Wheels are selected for this version, so
                         it has to match the device.
  --glibc VERSION        Target glibc version, e.g. 2.36 (default: 2.28).
                         Only wheels needing this or older are selected.

Other:
  --output FILE          Bundle path (default: dweos-offline-<ver>-<arch>.tar.gz)
  --debs DIR             Copy these .deb packages into the bundle. They get
                         installed with dpkg before the rest of the update.
  --skip-ttyd            Do not put a ttyd binary in the bundle
  -h, --help             Show this help

Example, for a Raspberry Pi running Python 3.11 on Debian bookworm:
  ./package-offline.sh --arch aarch64 --python 3.11 --glibc 2.36
USAGE
}

while [ $# -gt 0 ]; do
    case "$1" in
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
        --output)
            OUTPUT="$2"
            shift 2
            ;;
        --debs)
            DEBS_SOURCE="$2"
            shift 2
            ;;
        --skip-ttyd)
            SKIP_TTYD=1
            shift
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

# ---------------------------------------------------------------- target info

if [ -z "$TARGET_ARCH" ]; then
    TARGET_ARCH=$(uname -m)
    echo "No --arch given, assuming this machine's: $TARGET_ARCH"
fi

case "$TARGET_ARCH" in
    x86_64 | amd64)
        TARGET_ARCH="x86_64"
        TTYD_SUFFIX="x86_64"
        ;;
    aarch64 | arm64)
        TARGET_ARCH="aarch64"
        TTYD_SUFFIX="aarch64"
        ;;
    armv7l | armhf | arm)
        TARGET_ARCH="armv7l"
        TTYD_SUFFIX="arm"
        ;;
    *)
        echo "Error: unsupported target architecture: $TARGET_ARCH" >&2
        exit 1
        ;;
esac

if [ -z "$TARGET_PYTHON" ]; then
    TARGET_PYTHON=$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])')
    echo "No --python given, assuming this machine's: $TARGET_PYTHON"
fi

if ! echo "$TARGET_PYTHON" | grep -qE '^3\.[0-9]+$'; then
    echo "Error: --python expects a major.minor version like 3.11, got: $TARGET_PYTHON" >&2
    exit 1
fi
PYTHON_TAG="cp$(echo "$TARGET_PYTHON" | tr -d '.')"

if [ -z "$TARGET_GLIBC" ]; then
    GLIBC_MINOR="$DEFAULT_GLIBC_MINOR"
    echo "No --glibc given, limiting wheels to glibc 2.${GLIBC_MINOR} or older"
else
    GLIBC_MINOR=$(echo "$TARGET_GLIBC" | cut -d. -f2)
    if ! echo "$GLIBC_MINOR" | grep -qE '^[0-9]+$'; then
        echo "Error: --glibc expects a version like 2.36, got: $TARGET_GLIBC" >&2
        exit 1
    fi
    if [ "$GLIBC_MINOR" -lt "$MIN_GLIBC_MINOR" ]; then
        GLIBC_MINOR="$MIN_GLIBC_MINOR"
    fi
fi

echo
echo "Target: $TARGET_ARCH, Python $TARGET_PYTHON, glibc <= 2.${GLIBC_MINOR}"
echo

WORK_DIR=$(mktemp -d)
cleanup() {
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

BUNDLE_DIR="$WORK_DIR/dweos-offline"
mkdir -p "$BUNDLE_DIR/wheelhouse" "$BUNDLE_DIR/bin" "$BUNDLE_DIR/debs"

# ------------------------------------------------------------- release source

SOURCE_DESCRIPTION=""

if [ -n "$RELEASE_TARBALL" ] && [ "$BUILD_FROM_SOURCE" -eq 1 ]; then
    echo "Error: --release-tarball and --build-from-source are mutually exclusive" >&2
    exit 1
fi

if [ "$BUILD_FROM_SOURCE" -eq 1 ]; then
    echo "Building release from source..."
    (cd "$SCRIPT_DIR" && ./create_release.sh)
    RELEASE_TARBALL="$SCRIPT_DIR/release.tar.gz"
    SOURCE_DESCRIPTION="built from source"
elif [ -n "$RELEASE_TARBALL" ]; then
    SOURCE_DESCRIPTION="local tarball"
else
    if [ "$VERSION" = "latest" ]; then
        DOWNLOAD_URL="https://github.com/${GITHUB_REPO}/releases/latest/download/release.tar.gz"
    else
        DOWNLOAD_URL="https://github.com/${GITHUB_REPO}/releases/download/${VERSION}/release.tar.gz"
    fi
    echo "Downloading release ($VERSION) from $GITHUB_REPO..."
    curl -fL --progress-bar -o "$WORK_DIR/release.tar.gz" "$DOWNLOAD_URL"
    RELEASE_TARBALL="$WORK_DIR/release.tar.gz"
    SOURCE_DESCRIPTION="github:${GITHUB_REPO}@${VERSION}"
fi

if [ ! -f "$RELEASE_TARBALL" ]; then
    echo "Error: release tarball not found: $RELEASE_TARBALL" >&2
    exit 1
fi

cp "$RELEASE_TARBALL" "$BUNDLE_DIR/release.tar.gz"

# The requirements file and the installer both come out of the release, so the
# bundle always matches the version it installs
tar -xzf "$BUNDLE_DIR/release.tar.gz" -C "$WORK_DIR" release/backend_py/requirements.txt
REQUIREMENTS="$WORK_DIR/release/backend_py/requirements.txt"

if tar -tzf "$BUNDLE_DIR/release.tar.gz" | grep -qx "release/install-local.sh"; then
    tar -xzf "$BUNDLE_DIR/release.tar.gz" -C "$WORK_DIR" release/install-local.sh
    cp "$WORK_DIR/release/install-local.sh" "$BUNDLE_DIR/install-local.sh"
else
    # Older release: use the installer sitting next to this script
    echo "Release has no bundled installer, using $SCRIPT_DIR/install-local.sh"
    cp "$SCRIPT_DIR/install-local.sh" "$BUNDLE_DIR/install-local.sh"
fi
chmod +x "$BUNDLE_DIR/install-local.sh"

RELEASE_VERSION="unknown"
if tar -tzf "$BUNDLE_DIR/release.tar.gz" | grep -qx "release/VERSION"; then
    tar -xzf "$BUNDLE_DIR/release.tar.gz" -C "$WORK_DIR" release/VERSION
    RELEASE_VERSION=$(cat "$WORK_DIR/release/VERSION")
elif [ "$VERSION" != "latest" ]; then
    RELEASE_VERSION="$VERSION"
fi

echo "Release version: $RELEASE_VERSION"

# ------------------------------------------------------------------ wheelhouse

# pip runs inside a throwaway venv: a distribution-patched system pip can fail
# to build sdists that build fine in a clean environment.
echo
echo "Preparing a build environment for pip..."
python3 -m venv "$WORK_DIR/buildenv" >/dev/null
BUILD_PIP="$WORK_DIR/buildenv/bin/pip"

# Downloads here are large and often go over a slow or proxied link
PIP_NET_ARGS=(--retries 5 --timeout 60)

"$BUILD_PIP" install --quiet "${PIP_NET_ARGS[@]}" --upgrade pip setuptools wheel

WHEELHOUSE="$BUNDLE_DIR/wheelhouse"
PIP_LOG="$WORK_DIR/pip-download.log"

# Platform tags the device can install, newest manylinux first
PLATFORM_ARGS=()
for minor in $(seq "$GLIBC_MINOR" -1 "$MIN_GLIBC_MINOR"); do
    PLATFORM_ARGS+=(--platform "manylinux_2_${minor}_${TARGET_ARCH}")
done
PLATFORM_ARGS+=(--platform "manylinux2014_${TARGET_ARCH}")
if [ "$TARGET_ARCH" = "x86_64" ]; then
    PLATFORM_ARGS+=(--platform "manylinux2010_${TARGET_ARCH}")
    PLATFORM_ARGS+=(--platform "manylinux1_${TARGET_ARCH}")
fi
PLATFORM_ARGS+=(--platform "linux_${TARGET_ARCH}")
PLATFORM_ARGS+=(--platform any)

download_wheels() {
    "$BUILD_PIP" download \
        -r "$REQUIREMENTS" \
        -d "$WHEELHOUSE" \
        --find-links "$WHEELHOUSE" \
        "${PIP_NET_ARGS[@]}" \
        --only-binary=:all: \
        "${PLATFORM_ARGS[@]}" \
        --python-version "$TARGET_PYTHON" \
        --implementation cp \
        --abi "$PYTHON_TAG" --abi abi3 --abi none \
        >"$PIP_LOG" 2>&1
}

# pip can only cross-select wheels, never sdists. When a dependency ships no
# wheel at all, build one here and drop it in the wheelhouse -- but only keep
# it if it came out architecture independent, since anything else would be
# built for this machine rather than the device.
build_portable_wheel() {
    local spec="$1"
    local sdist_dir="$WORK_DIR/sdist"
    local built_dir="$WORK_DIR/built"

    echo "  $spec ships no wheel, building one from its source distribution..."
    rm -rf "$sdist_dir" "$built_dir"
    mkdir -p "$sdist_dir" "$built_dir"

    if ! "$BUILD_PIP" download "${PIP_NET_ARGS[@]}" --no-deps --no-binary :all: "$spec" -d "$sdist_dir" >>"$PIP_LOG" 2>&1; then
        echo "Error: could not download a source distribution for $spec" >&2
        tail -n 20 "$PIP_LOG" >&2
        exit 1
    fi

    if ! "$BUILD_PIP" wheel --no-deps "$sdist_dir"/* -w "$built_dir" >>"$PIP_LOG" 2>&1; then
        echo "Error: could not build a wheel for $spec" >&2
        tail -n 20 "$PIP_LOG" >&2
        exit 1
    fi

    local wheel
    for wheel in "$built_dir"/*.whl; do
        case "$(basename "$wheel")" in
            *-none-any.whl)
                mv "$wheel" "$WHEELHOUSE/"
                echo "  built $(basename "$wheel")"
                ;;
            *)
                echo "Error: $spec built into $(basename "$wheel"), which is specific to" >&2
                echo "  this machine rather than $TARGET_ARCH/Python $TARGET_PYTHON." >&2
                echo "  Run package-offline.sh on a machine matching the device (or in a" >&2
                echo "  container for that architecture) to package this dependency." >&2
                exit 1
                ;;
        esac
    done
}

echo "Collecting Python wheels for $TARGET_ARCH / Python $TARGET_PYTHON..."

RESOLVED=""
attempt=0
while ! download_wheels; do
    attempt=$((attempt + 1))
    if [ "$attempt" -gt 25 ]; then
        echo "Error: gave up resolving Python dependencies after $attempt attempts" >&2
        tail -n 30 "$PIP_LOG" >&2
        exit 1
    fi

    MISSING=$(sed -n 's/^ERROR: No matching distribution found for //p' "$PIP_LOG" | head -n 1)
    if [ -z "$MISSING" ]; then
        echo "Error: could not collect Python wheels" >&2
        tail -n 30 "$PIP_LOG" >&2
        exit 1
    fi

    case " $RESOLVED " in
        *" $MISSING "*)
            echo "Error: $MISSING still cannot be resolved after building it" >&2
            tail -n 30 "$PIP_LOG" >&2
            exit 1
            ;;
    esac
    RESOLVED="$RESOLVED $MISSING"

    build_portable_wheel "$MISSING"
done

# pip, setuptools and wheel go in too: pip needs them to build anything on the
# device, and it lets the device upgrade its own pip without internet
"$BUILD_PIP" download --quiet "${PIP_NET_ARGS[@]}" -d "$WHEELHOUSE" --only-binary=:all: --platform any \
    --python-version "$TARGET_PYTHON" --implementation py --abi none \
    pip setuptools wheel >>"$PIP_LOG" 2>&1 ||
    echo "Note: could not add pip/setuptools/wheel to the wheelhouse"

cp "$REQUIREMENTS" "$WHEELHOUSE/requirements.txt"

WHEEL_COUNT=$(find "$WHEELHOUSE" -name '*.whl' | wc -l)
echo "Wheelhouse: $WHEEL_COUNT wheels"

# ----------------------------------------------------------------------- ttyd

if [ "$SKIP_TTYD" -eq 1 ]; then
    echo "Skipping ttyd"
else
    echo "Downloading ttyd ${TTYD_VERSION} for ${TTYD_SUFFIX}..."
    if curl -fL --progress-bar -o "$BUNDLE_DIR/bin/ttyd" \
        "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${TTYD_SUFFIX}"; then
        chmod +x "$BUNDLE_DIR/bin/ttyd"
    else
        echo "Warning: could not download ttyd, the bundle will not carry it"
        rm -f "$BUNDLE_DIR/bin/ttyd"
    fi
fi

# ----------------------------------------------------------------- deb packages

if [ -n "$DEBS_SOURCE" ]; then
    if [ ! -d "$DEBS_SOURCE" ]; then
        echo "Error: --debs directory not found: $DEBS_SOURCE" >&2
        exit 1
    fi
    if ls "$DEBS_SOURCE"/*.deb >/dev/null 2>&1; then
        cp "$DEBS_SOURCE"/*.deb "$BUNDLE_DIR/debs/"
        echo "Included $(find "$BUNDLE_DIR/debs" -name '*.deb' | wc -l) .deb packages"
    else
        echo "Warning: no .deb files found in $DEBS_SOURCE"
    fi
fi

# -------------------------------------------------------------------- manifest

cat > "$BUNDLE_DIR/MANIFEST" <<MANIFEST
BUNDLE_FORMAT=1
DWEOS_VERSION=$RELEASE_VERSION
TARGET_ARCH=$TARGET_ARCH
TARGET_PYTHON=$TARGET_PYTHON
TARGET_GLIBC=2.${GLIBC_MINOR}
WHEEL_COUNT=$WHEEL_COUNT
SOURCE=$SOURCE_DESCRIPTION
BUILT_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
BUILT_ON=$(uname -m)
MANIFEST

# --------------------------------------------------------- bundle entry point

cat > "$BUNDLE_DIR/install-offline.sh" <<'INSTALLER'
#!/bin/bash
#
# Installs or updates DWE OS from this bundle. Nothing here touches the
# network. Run as root on the device:
#
#   sudo ./install-offline.sh
#
# Any extra arguments are passed straight through to install-local.sh, so
# --recreate-venv and --install-dir work here too.

set -e

BUNDLE_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root" >&2
    exit 1
fi

manifest_value() {
    sed -n "s/^$1=//p" "$BUNDLE_DIR/MANIFEST"
}

BUNDLE_ARCH=$(manifest_value TARGET_ARCH)
BUNDLE_PYTHON=$(manifest_value TARGET_PYTHON)
BUNDLE_VERSION=$(manifest_value DWEOS_VERSION)

DEVICE_ARCH=$(uname -m)
DEVICE_PYTHON=$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])' 2>/dev/null || echo "none")

echo "Bundle: DWE OS $BUNDLE_VERSION for $BUNDLE_ARCH / Python $BUNDLE_PYTHON"
echo "Device: $DEVICE_ARCH / Python $DEVICE_PYTHON"

# The wheels in this bundle were picked for one architecture and one Python
# version. Installing them anywhere else fails at import time rather than
# install time, so stop here instead.
if [ "$DEVICE_ARCH" != "$BUNDLE_ARCH" ]; then
    echo >&2
    echo "Error: this bundle was built for $BUNDLE_ARCH but this device is $DEVICE_ARCH." >&2
    echo "Rebuild it with: ./package-offline.sh --arch $DEVICE_ARCH" >&2
    exit 1
fi

if [ "$DEVICE_PYTHON" != "$BUNDLE_PYTHON" ]; then
    echo >&2
    echo "Error: this bundle was built for Python $BUNDLE_PYTHON but this device" >&2
    echo "runs Python $DEVICE_PYTHON." >&2
    echo "Rebuild it with: ./package-offline.sh --arch $DEVICE_ARCH --python $DEVICE_PYTHON" >&2
    exit 1
fi

TTYD_ARGS=()
if [ -f "$BUNDLE_DIR/bin/ttyd" ]; then
    TTYD_ARGS=(--ttyd-binary "$BUNDLE_DIR/bin/ttyd")
fi

exec bash "$BUNDLE_DIR/install-local.sh" \
    --offline \
    --wheelhouse "$BUNDLE_DIR/wheelhouse" \
    --debs "$BUNDLE_DIR/debs" \
    "${TTYD_ARGS[@]}" \
    "$@" \
    "$BUNDLE_DIR/release.tar.gz"
INSTALLER
chmod +x "$BUNDLE_DIR/install-offline.sh"

# ---------------------------------------------------------------------- output

if [ -z "$OUTPUT" ]; then
    OUTPUT="$PWD/dweos-offline-${RELEASE_VERSION}-${TARGET_ARCH}-py${TARGET_PYTHON}.tar.gz"
fi

tar -czf "$OUTPUT" -C "$WORK_DIR" dweos-offline

echo
echo "Bundle written to $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"

# deploy-offline.sh sets this: it is about to copy the bundle over itself
if [ -z "${PACKAGE_HIDE_HINTS:-}" ]; then
    echo
    echo "Copy it to the device and run:"
    echo "  tar -xzf $(basename "$OUTPUT")"
    echo "  sudo ./dweos-offline/install-offline.sh"
    echo
    echo "Or do both at once: ./deploy-offline.sh --bundle $OUTPUT user@device"
fi
