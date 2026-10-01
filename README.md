# dweOS

[![Backend CI](https://github.com/DeepWaterExploration/dweOS/actions/workflows/backend.yml/badge.svg)](https://github.com/DeepWaterExploration/dweOS/actions/workflows/backend.yml) [![Frontend CI](https://github.com/DeepWaterExploration/dweOS/actions/workflows/frontend.yml/badge.svg)](https://github.com/DeepWaterExploration/dweOS/actions/workflows/frontend.yml) [![Build Release](https://github.com/DeepWaterExploration/dweOS/actions/workflows/release.yml/badge.svg)](https://github.com/DeepWaterExploration/dweOS/actions/workflows/release.yml)

Web interface driver for DWE.ai cameras.

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

## Building the RPi Image

```
git clone https://github.com/DeepwaterExploration/pi-gen
cd pi-gen
sudo ./build.sh -c config
```

The image will be found in the deploy folder. The latest release from github will be used for building the image.

## Creating a Release

Releases are versioned from `frontend/package.json` and use [conventional commits](https://www.conventionalcommits.org) to generate `CHANGELOG.md`. You need [git-cliff](https://git-cliff.org), `npm`, and the [GitHub CLI](https://cli.github.com) (`gh`).

1. Run `./bump_version.sh X.Y.Z` from a clean working tree. The script:
    - creates `release/vX.Y.Z` from the latest `origin/main`
    - sets the version in `frontend/package.json` and `package-lock.json`
    - prepends the release notes to `CHANGELOG.md` with git-cliff
    - commits `chore(release): vX.Y.Z`, then pushes the branch and opens a PR after you confirm

   Use `--no-push` to stop after the local commit, or `-y` to skip the confirmation.
2. Wait for Backend CI and Frontend CI to pass on the PR, then merge it.
3. The [Tag Release](.github/workflows/tag-release.yml) workflow tags the merge commit as `vX.Y.Z` and starts [Build Release](.github/workflows/release.yml). That workflow creates a draft GitHub release.
4. Publish the draft release in the GitHub UI.
