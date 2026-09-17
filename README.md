# dweOS

[![Backend CI](https://github.com/DeepWaterExploration/dweOS/actions/workflows/backend.yml/badge.svg)](https://github.com/DeepWaterExploration/dweOS/actions/workflows/backend.yml) [![Frontend CI](https://github.com/DeepWaterExploration/dweOS/actions/workflows/frontend.yml/badge.svg)](https://github.com/DeepWaterExploration/dweOS/actions/workflows/frontend.yml) [![Build Release](https://github.com/DeepWaterExploration/dweOS/actions/workflows/release.yml/badge.svg)](https://github.com/DeepWaterExploration/dweOS/actions/workflows/release.yml)

Web interface driver for DWE.ai cameras.

## Installation

To install for any *supported* Linux system, run the following command: 

`curl -s https://raw.githubusercontent.com/DeepwaterExploration/DWE_OS_2/main/install.sh | sudo bash -s`

### Installing or updating a device with no internet access

Build a bundle on a machine that has internet, then push it to the device over
SSH. The device never reaches out to GitHub, PyPI or apt:

```sh
./deploy-offline.sh pi@192.168.2.2
```

If the device is not reachable from the machine with internet either, build the
bundle and carry it across yourself:

```sh
# on the machine with internet, describing the device
./package-offline.sh --arch aarch64 --python 3.11 --glibc 2.36

# on the device
tar -xzf dweos-offline-*.tar.gz
sudo ./dweos-offline/install-offline.sh
```

Python packages are updated from the bundle's wheelhouse, so dependency changes
ship with the update. See [docs/offline-update.md](docs/offline-update.md).

### Raspberry Pi Hardware PWM

In order to enable hardware PWM on your Raspberry Pi, you need to edit `/boot/firmware/config.txt`. See [Raspberry Pi documentation](https://www.raspberrypi.com/documentation/computers/config_txt.html) for more information.

Add the following lines to the end of the file, and reboot.

```
[all]
dtoverlay=pwm-2chan
```

## Building for development

1. Clone the repository

```sh
git clone https://github.com/DeepwaterExploration/DWE_OS_2.git
cd DWE_OS_2
```

3. Build the project

```sh
cd frontend
npm install
cd ..
sudo chmod -R 777 ./
./create_release.sh
```

## Building the RPi Image

```
git clone https://github.com/DeepwaterExploration/pi-gen
cd pi-gen
sudo ./build.sh -c config
```

The image will be found in the deploy folder. The latest release from github will be used for building the image.
