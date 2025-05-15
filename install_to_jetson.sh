#!/bin/bash
set -e

JETSON="$1"
PWM_OFFSET="$2"
PASSWORD="$3"

if [ -z "$JETSON" ]; then
    echo "Usage: $0 <user@jetson-ip>"
    exit 1
fi

if [ -z "$PWM_OFFSET" ]; then
    echo "Using default PWM offset of 0.0"
    PWM_OFFSET="0.0"
fi

if [ -z "$PASSWORD" ]; then
    echo "Assuming default password: deepwater. It is recommended to change this password."
    PASSWORD="deepwater"
fi

echo "[+] Connecting to Jetson at $JETSON..."

# Step: SCP the release file to the Jetson
echo "[+] Copying release.tar.gz to Jetson..."
sshpass -p "$PASSWORD" scp release.tar.gz "$JETSON:/tmp/release.tar.gz"

# Step: SSH into Jetson and run the install steps
sshpass -p "$PASSWORD" ssh "$JETSON" 'bash -s' <<EOF
set -e

echo "$PASSWORD" | sudo -S echo "[1/8] Deleting existing installation if installed..."
sudo systemctl stop dwe_os_2.service || true
sudo systemctl disable dwe_os_2.service || true
sudo rmmod ch34x || true
sudo rm -rf /opt/CH341SER
sudo rm -f /etc/systemd/system/dwe_os_2.service
sudo rm -rf /opt/DWE_OS_2

echo "[2/8] Removing brltty..."
echo "$PASSWORD" | sudo -S apt-get remove -y brltty || true

echo "[3/8] Cloning CH341SER driver..."
sudo git clone https://github.com/juliagoda/CH341SER /opt/CH341SER || true
cd /opt/CH341SER
sudo make
sudo make load

echo "[4/8] Extracting DWE_OS_2 release..."
sudo mkdir -p /opt/DWE_OS_2
cd /opt/DWE_OS_2
sudo mv /tmp/release.tar.gz .
sudo tar -xzf release.tar.gz --strip-components=1
sudo rm release.tar.gz

echo "[5/8] Running DWE_OS_2 install script..."
chmod +x *.sh
sudo ./install_requirements.sh
sudo ./create_venv.sh

echo "[6/8] Setting up systemd service..."
sudo cp /opt/DWE_OS_2/service/dwe_os_2.service /etc/systemd/system/
sudo systemctl enable dwe_os_2.service
sudo systemctl start dwe_os_2

echo "[7/8] Ensuring device-intrinsics directory and PWM_OFFSET file..."
sudo mkdir -p /opt/device-intrinsics
if [ ! -f /opt/device-intrinsics/PWM_OFFSET ]; then
    echo "$PWM_OFFSET" | sudo tee /opt/device-intrinsics/PWM_OFFSET > /dev/null
    echo "[+] Created /opt/device-intrinsics/PWM_OFFSET with default value $PWM_OFFSET"
else
    echo "[+] PWM_OFFSET already exists. Skipping..."
fi

echo "[8/8] Jetson setup complete. You can access from jetson-ip.local"
EOF
