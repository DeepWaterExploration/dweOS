# DWE OS 2.0

API and driver rewrite of DWE OS

## Installation

To install for any *supported* Linux system, run the following command: 

`curl -s https://raw.githubusercontent.com/DeepwaterExploration/DWE_OS_2/main/install.sh | sudo bash -s`

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
