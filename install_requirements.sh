#!/bin/bash

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

# download and install ttyd
install_ttyd() {
    local arch=$(get_arch)
    if [ "$arch" = "unsupported" ]; then
        echo "Error: Unsupported architecture $(uname -m)"
        exit 1
    fi

    local version="1.6.3"
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
    if ! sudo mv "$filename" /usr/local/bin/ttyd; then
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

# update dependencies
sudo apt-get update -y

# Install python and gstreamer dependencies
echo "Installing Python dependencies..."
sudo apt-get install python3 python3-venv -y
# For dbus-python
sudo apt-get install libdbus-glib-1-dev libdbus-1-dev libpython3-dev -y

echo "Installing GStreamer dependencies..."
sudo apt-get install -y libglib2.0-dev libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-tools gstreamer1.0-x gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-libav

# Attempt to install ttyd through apt. If it fails, download from GitHub
echo "Installing ttyd..."
if ! sudo apt-get install -y ttyd; then
    echo "ttyd not available in repositories, downloading from GitHub..."
    install_ttyd
else
    # Disable ttyd service
    sudo systemctl disable ttyd
    echo "ttyd installed from repositories"
fi

echo "Requirements installed."