#!/bin/bash

TTYD_VERSION="1.6.3"

OFFLINE=0
TTYD_BINARY=""
DEBS_DIR=""

usage() {
    cat <<'USAGE'
Usage: install_requirements.sh [options]

Installs the system packages DWE OS needs (Python, GStreamer, ttyd).

Options:
  --offline           Do not touch the network. apt is skipped entirely; ttyd
                      and any .deb packages are taken from the local files
                      given below. Used when updating a device that has no
                      internet access.
  --ttyd-binary FILE  Install this prebuilt ttyd binary instead of downloading
                      one. Ignored if ttyd is already installed.
  --debs DIR          Install every .deb in DIR with dpkg before anything else.
                      Optional; used to carry system packages onto an offline
                      device.
  -h, --help          Show this help
USAGE
}

while [ $# -gt 0 ]; do
    case "$1" in
        --offline)
            OFFLINE=1
            shift
            ;;
        --ttyd-binary)
            TTYD_BINARY="$2"
            shift 2
            ;;
        --debs)
            DEBS_DIR="$2"
            shift 2
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

# Run privileged commands directly when already root; offline devices are not
# guaranteed to have sudo installed.
if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
elif command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
else
    echo "Error: not running as root and sudo is not available" >&2
    exit 1
fi

# detect system architecture
get_arch() {
    local arch=$(uname -m)
    case $arch in
        x86_64)
            echo "x86_64"
            ;;
        aarch64)
            echo "aarch64"
            ;;
        armv7l)
            echo "arm"
            ;;
        *)
            echo "unsupported"
            ;;
    esac
}

# install a ttyd binary that is already on disk
install_ttyd_binary() {
    local source_file="$1"

    if ! $SUDO install -m 755 "$source_file" /usr/local/bin/ttyd; then
        echo "Error: Failed to install ttyd from $source_file"
        return 1
    fi

    echo "Successfully installed ttyd from $source_file"
    return 0
}

# download and install ttyd
install_ttyd() {
    local arch=$(get_arch)
    if [ "$arch" = "unsupported" ]; then
        echo "Error: Unsupported architecture $(uname -m)"
        exit 1
    fi

    local version="$TTYD_VERSION"
    local filename="ttyd.x86_64"

    # set filename based on architecture
    case $arch in
        x86_64)
            filename="ttyd.x86_64"
            ;;
        aarch64)
            filename="ttyd.aarch64"
            ;;
        arm)
            filename="ttyd.arm"
            ;;
    esac

    echo "Downloading ttyd version ${version} for ${arch}..."

    # create temporary directory
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"

    # Download the binary
    if ! curl -L -o "$filename" "https://github.com/tsl0922/ttyd/releases/download/${version}/${filename}"; then
        echo "Error: Failed to download ttyd"
        rm -rf "$temp_dir"
        exit 1
    fi

    # make it executable
    chmod +x "$filename"

    # move to /usr/local/bin so it can be executed by the program
    if ! $SUDO mv "$filename" /usr/local/bin/ttyd; then
        echo "Error: Failed to install ttyd"
        rm -rf "$temp_dir"
        exit 1
    fi

    # clean up
    cd - > /dev/null
    rm -rf "$temp_dir"

    echo "Successfully installed ttyd version ${version}"

    # verify installation
    if command -v ttyd >/dev/null 2>&1; then
        echo "ttyd is now available at: $(which ttyd)"
        echo "Version: $(ttyd --version)"
    else
        echo "Error: ttyd installation verification failed"
        exit 1
    fi
}

# report on system packages we cannot install without the network
check_offline_dependencies() {
    local missing=""

    command -v python3 >/dev/null 2>&1 || missing="$missing python3"
    python3 -c "import venv" >/dev/null 2>&1 || missing="$missing python3-venv"
    command -v gst-inspect-1.0 >/dev/null 2>&1 || missing="$missing gstreamer1.0-tools"
    command -v exiftool >/dev/null 2>&1 || missing="$missing libimage-exiftool-perl"

    if [ -n "$missing" ]; then
        echo "Warning: these system packages look missing and cannot be installed offline:"
        echo "   $missing"
        echo "   Install them on the device (or pass --debs DIR) before DWE OS will run."
        return 1
    fi

    echo "System dependencies present."
    return 0
}

# install .deb files carried along with an offline bundle
install_local_debs() {
    local debs_dir="$1"

    # A bundle always has the directory; it is usually empty
    if ! ls "$debs_dir"/*.deb >/dev/null 2>&1; then
        return 0
    fi

    echo "Installing local .deb packages from $debs_dir..."
    if ! $SUDO dpkg -i "$debs_dir"/*.deb; then
        echo "Warning: some .deb packages failed to install (unmet dependencies?)."
        echo "   Run 'dpkg -l | grep ^i[^i]' on the device to inspect."
    fi
}

if [ -n "$DEBS_DIR" ] && [ -d "$DEBS_DIR" ]; then
    install_local_debs "$DEBS_DIR"
fi

if [ "$OFFLINE" -eq 1 ]; then
    echo "Offline mode: skipping apt-get."
    check_offline_dependencies || true
else
    # update dependencies
    $SUDO apt-get update -y

    # Install python and gstreamer dependencies
    echo "Installing Python dependencies..."
    $SUDO apt-get install python3 python3-venv -y

    echo "Installing GStreamer dependencies..."
    $SUDO apt-get install -y libglib2.0-dev libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-tools gstreamer1.0-x gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-libav gstreamer1.0-plugins-ugly libimage-exiftool-perl
fi

echo "Installing ttyd..."
if command -v ttyd >/dev/null 2>&1 && [ "$OFFLINE" -eq 1 ] && [ -z "$TTYD_BINARY" ]; then
    echo "ttyd already installed at $(command -v ttyd)"
elif [ -n "$TTYD_BINARY" ] && [ -f "$TTYD_BINARY" ]; then
    install_ttyd_binary "$TTYD_BINARY" || exit 1
elif [ "$OFFLINE" -eq 1 ]; then
    echo "Warning: ttyd is not installed and no local binary was provided."
    echo "   The web terminal will be unavailable until ttyd is installed."
# Attempt to install ttyd through apt. If it fails, download from GitHub
elif ! $SUDO apt-get install -y ttyd; then
    echo "ttyd not available in repositories, downloading from GitHub..."
    install_ttyd
else
    # Disable ttyd service
    $SUDO systemctl disable ttyd
    echo "ttyd installed from repositories"
fi

echo "Requirements installed."
