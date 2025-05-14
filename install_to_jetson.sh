#!/bin/bash
set -e

JETSON="$1"

if [ -z "$JETSON" ]; then
    echo "Usage: $0 <user@jetson-ip>"
    exit 1
fi

RELEASE_URL="https://github.com/DeepWaterExploration/DWE_OS_2/releases/download/v0.5.0-beta.usb.pwm/release.tar.gz"

echo "[+] Enter Jetson sudo password:"
read -s PASSWORD

echo "[+] Connecting to Jetson at $JETSON..."

sshpass -p "$PASSWORD" ssh "$JETSON" 'bash -s' <<EOF
set -e

echo "$PASSWORD" | sudo -S echo "[1/7] Deleting existing installation if installed..."
# Unload the driver if it's loaded
# Stop and disable the service first (if active)
sudo systemctl stop dwe_os_2.service || true
sudo systemctl disable dwe_os_2.service || true
sudo rmmod ch34x || true

# Remove the CH341SER directory
sudo rm -rf /opt/CH341SER

# Remove the service file
sudo rm -f /etc/systemd/system/dwe_os_2.service

# Remove the app directory
sudo rm -rf /opt/DWE_OS_2

echo "[2/7] Removing brltty..."
echo "$PASSWORD" | sudo -S apt-get remove -y brltty || true

echo "[3/7] Cloning CH341SER driver..."
sudo git clone https://github.com/juliagoda/CH341SER /opt/CH341SER || true
cd /opt/CH341SER
sudo make
sudo make load

echo "[4/7] Downloading DWE_OS_2 release..."
sudo mkdir -p /opt/DWE_OS_2
cd /opt/DWE_OS_2
sudo wget -O release.tar.gz "$RELEASE_URL"
sudo tar -xzf release.tar.gz --strip-components=1
sudo rm release.tar.gz

echo "[5/7] Running DWE_OS_2 install script..."
cd /opt/DWE_OS_2
chmod +x *.sh
sudo ./install_requirements.sh
sudo ./create_venv.sh

echo "[6/7] Setting up systemd service..."
sudo cp /opt/DWE_OS_2/service/dwe_os_2.service /etc/systemd/system/
sudo systemctl enable dwe_os_2.service
sudo systemctl start dwe_os_2

echo "[7/7] Jetson setup complete. You can access from jetson-ip.local"
EOF
