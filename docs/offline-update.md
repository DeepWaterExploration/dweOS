# Updating a device without internet access

Devices in the field usually cannot reach GitHub, PyPI or a Debian mirror. The
offline flow moves that requirement onto your laptop: you build a bundle on a
machine that *does* have internet, then hand the whole thing to the device over
SSH. The device never makes an outbound connection.

A bundle contains everything an update needs:

| Path                 | What it is                                            |
| -------------------- | ----------------------------------------------------- |
| `release.tar.gz`     | The DWE OS release being installed                     |
| `wheelhouse/`        | Every Python wheel, built for the device's arch/Python |
| `bin/ttyd`           | A matching `ttyd` binary                               |
| `debs/`              | Optional `.deb` packages (empty by default)            |
| `install-offline.sh` | The entry point you run on the device                  |
| `install-local.sh`   | The installer itself                                   |
| `MANIFEST`           | What the bundle was built for                          |

## One command

From a checkout, on a machine with internet:

```sh
./deploy-offline.sh pi@192.168.2.2
```

That asks the device what it is, builds a bundle for it, copies it over, and
runs the installer. Useful options:

```sh
# a specific release instead of the latest
./deploy-offline.sh --version v0.7.4 pi@192.168.2.2

# what is in this checkout, built from source
./deploy-offline.sh --build-from-source pi@192.168.2.2

# non-default SSH settings
./deploy-offline.sh --port 2222 --identity ~/.ssh/id_dwe pi@192.168.2.2

# force a clean virtual environment on the device
./deploy-offline.sh --install-arg --recreate-venv pi@192.168.2.2
```

## Two steps

When the device is not reachable from the machine with internet — an air-gapped
site, or a USB stick in between — build the bundle and carry it across
yourself.

On the machine with internet:

```sh
./package-offline.sh --arch aarch64 --python 3.11 --glibc 2.36
```

`--arch`, `--python` and `--glibc` describe **the device**, not the machine
building the bundle. Read them off the device with:

```sh
uname -m
python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])'
getconf GNU_LIBC_VERSION
```

Then, on the device:

```sh
tar -xzf dweos-offline-v0.7.4-aarch64-py3.11.tar.gz
sudo ./dweos-offline/install-offline.sh
```

`install-offline.sh` checks the bundle against the device before touching
anything and stops if the architecture or Python version does not match, since
mismatched wheels install cleanly and then fail at import time.

## Updating the Python packages

`requirements.txt` is resolved at bundle time, so a bundle always carries the
exact set of wheels that release wants. On the device, pip installs from the
wheelhouse with `--no-index --upgrade`: pinned packages move to their pinned
version, unpinned ones move to whatever was resolved when the bundle was built,
and nothing reaches out to PyPI. The bundle also carries `pip`, `setuptools`
and `wheel`, so the device's own pip gets updated too.

The virtual environment is kept between updates and upgraded in place. Only the
packages that actually changed are rewritten, which makes a repeat update take
a second or two. Pass `--recreate-venv` to rebuild it from scratch.

## System packages

`apt` is skipped entirely in offline mode. DWE OS's system dependencies
(GStreamer, `python3-venv`, exiftool) come from the initial install or the
Raspberry Pi image and rarely change, so an update does not need them. The
installer checks for them and warns if something is missing rather than
failing silently.

If a system package genuinely has to change, carry the `.deb` files along. On a
machine running the same distribution and architecture as the device:

```sh
mkdir debs
sudo apt-get install --reinstall --download-only -o Dir::Cache::archives="$PWD/debs" <packages>
```

Then build the bundle with `--debs debs`, and the installer will `dpkg -i` them
before the rest of the update. `dpkg` does not resolve dependencies, so the
directory has to hold the full dependency closure.

## When a dependency has no wheel

`package-offline.sh` selects wheels for the target platform; pip cannot do that
for source-only packages. When a dependency ships no wheel at all, the script
builds one and keeps it only if it came out architecture independent
(`*-none-any.whl`). `PyEventEmitter` is the current example.

If a source-only dependency ever turns out to be a C extension, the build stops
with an error, because the wheel would be for the build machine rather than the
device. Build the bundle on a machine matching the device instead — either the
real hardware, or a container for that architecture:

```sh
docker run --rm --platform linux/arm64 -v "$PWD:/src" -w /src \
    python:3.11-slim-bookworm \
    sh -c 'apt-get update && apt-get install -y curl build-essential && ./package-offline.sh'
```

## Script reference

| Script                   | Where it runs          | What it does                                   |
| ------------------------ | ---------------------- | ---------------------------------------------- |
| `deploy-offline.sh`      | machine with internet  | probe, package, copy over SSH, install         |
| `package-offline.sh`     | machine with internet  | build a bundle for a given target              |
| `install-offline.sh`     | device (in the bundle) | check the bundle fits, then install offline    |
| `install-local.sh`       | device                 | install from a release tarball already on disk |
| `install.sh`             | device                 | download the latest release and install it     |
| `install_requirements.sh`| device                 | system packages (`--offline` skips apt)        |
| `create_venv.sh`         | device                 | the venv (`--wheelhouse` installs offline)     |

Each takes `--help`.
