#!/bin/bash

# A bash script for installing a specific desired version of Python (in this case, Python 3.11) on your Raspberry Pi.
# (c) 2023 Miguel Villa Floran (DeepWater Exploration)
#
# Usage: Open your terminal and type the following command:
# sudo wget https://raw.githubusercontent.com/DeepwaterExploration/DWE_OS/main/system_api/raspberry_python.sh && chmod +x raspberry_python.sh && ./raspberry_python.sh
# or
# bash < <(curl -s https://raw.githubusercontent.com/DeepwaterExploration/DWE_OS/main/system_api/raspberry_python.sh)

python_version_short="3.11"
python_version="$python_version_short.4"

sudo apt update -y && sudo apt upgrade -y
sudo apt install -y build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libsqlite3-dev libreadline-dev libffi-dev wget

mkdir python-installation
cd python-installation

wget https://www.python.org/ftp/python/$python_version/Python-$python_version.tgz
tar xzvf Python-$python_version.tgz
rm -f Python-$python_version.tgz

cd Python-$python_version
sudo ./configure --enable-optimizations
sudo make -j 4 # Adjust the number based on the number of CPU cores for faster compilation
sudo make altinstall

# Set Python 3.11 as the default Python version
sudo update-alternatives --install /usr/bin/python3 python3 $(which $python_version_short) 1
