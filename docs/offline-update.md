# Updating a device without internet access

For customers whose devices cannot reach GitHub or PyPI. `offline-update.sh`
runs on a machine that *does* have internet: it collects the release and every
Python wheel that release needs, ships the lot to the device over SSH, and
installs it there. The device makes no outbound connection.

```sh
./offline-update.sh pi@192.168.2.2
```

That asks the device for its architecture and Python version, builds a bundle
matching it, and installs. Other forms:

```sh
# a specific release rather than the latest
./offline-update.sh --version v0.7.4 pi@192.168.2.2

# what is in this checkout
./create_release.sh
./offline-update.sh --release-tarball release.tar.gz pi@192.168.2.2

# non-default SSH settings
./offline-update.sh --port 2222 --identity ~/.ssh/id_dwe pi@192.168.2.2
```

If the device is not reachable from the machine with internet either, build the
bundle and carry it across on a USB stick. There is nothing to probe, so name
the target yourself:

```sh
./offline-update.sh --arch aarch64 --python 3.11 --pack-only dwe-update.tar.gz
```

```sh
# on the device
tar -xzf dwe-update.tar.gz
sudo ./dwe-update/install.sh
```

Read `--arch` and `--python` off the device with `uname -m` and
`python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])'`.

## What it does and does not do

Python packages come from the bundle, installed with `--no-index --upgrade`, so
dependency changes ship with the update. The virtual environment is kept and
upgraded in place, which makes a repeat update take a second or two.

The bundle is built for one architecture and one Python version. `install.sh`
checks both before touching anything and stops if they do not match, because
mismatched wheels install cleanly and then fail at import time.

**This only updates a device DWE OS is already installed on.** `apt` is never
run, so GStreamer, `python3-venv` and `ttyd` have to be there already. They come
with the initial install and the Raspberry Pi image. A device being set up for
the first time still needs `install.sh` from the repository root, with internet.

One dependency, `PyEventEmitter`, publishes no wheel. The script builds one and
keeps it only if it comes out architecture independent. If a source-only
dependency ever turns out to be a C extension, the build stops rather than
shipping a wheel built for the wrong machine; build the bundle on a machine
matching the device instead, with `--pack-only`.
