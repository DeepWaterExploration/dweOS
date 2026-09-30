#!/bin/bash

set -e

VENV_DIR=".venv"
REQUIREMENTS="backend_py/requirements.txt"
PYTHON_BIN="python3"
WHEELHOUSE=""
RECREATE=0
UPGRADE=1

usage() {
    cat <<'USAGE'
Usage: create_venv.sh [options]

Creates (or refreshes) the Python virtual environment used by DWE OS.

Options:
  --venv DIR           Virtual environment directory (default: .venv)
  --requirements FILE  Requirements file (default: backend_py/requirements.txt)
  --python BIN         Python interpreter used to create the venv (default: python3)
  --wheelhouse DIR     Install from a local directory of wheels instead of PyPI.
                       Implies a fully offline pip run (--no-index).
  --recreate           Delete and rebuild the virtual environment from scratch
  --no-upgrade         Leave already-satisfied packages at their current version
  -h, --help           Show this help
USAGE
}

while [ $# -gt 0 ]; do
    case "$1" in
        --venv)
            VENV_DIR="$2"
            shift 2
            ;;
        --requirements)
            REQUIREMENTS="$2"
            shift 2
            ;;
        --python)
            PYTHON_BIN="$2"
            shift 2
            ;;
        --wheelhouse)
            WHEELHOUSE="$2"
            shift 2
            ;;
        --recreate)
            RECREATE=1
            shift
            ;;
        --no-upgrade)
            UPGRADE=0
            shift
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

if [ ! -f "$REQUIREMENTS" ]; then
    echo "Error: requirements file not found: $REQUIREMENTS" >&2
    exit 1
fi

PIP_ARGS=()
if [ -n "$WHEELHOUSE" ]; then
    if [ ! -d "$WHEELHOUSE" ]; then
        echo "Error: wheelhouse directory not found: $WHEELHOUSE" >&2
        exit 1
    fi
    # Absolute path, since pip is invoked after the venv is activated
    WHEELHOUSE=$(cd "$WHEELHOUSE" && pwd)
    PIP_ARGS+=(--no-index --find-links "$WHEELHOUSE")
    echo "Installing Python packages offline from $WHEELHOUSE"
fi

if [ "$UPGRADE" -eq 1 ]; then
    PIP_ARGS+=(--upgrade)
fi

if [ "$RECREATE" -eq 1 ] && [ -d "$VENV_DIR" ]; then
    echo "Removing existing virtual environment in $VENV_DIR"
    rm -rf "$VENV_DIR"
fi

if [ -x "$VENV_DIR/bin/python3" ]; then
    echo "Reusing existing virtual environment in $VENV_DIR directory"
else
    echo "Creating virtual python environment in $VENV_DIR directory"
    # A leftover, half-built venv would make the next step fail in confusing ways
    rm -rf "$VENV_DIR"
    "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

if [ ! -x "$VENV_DIR/bin/pip" ]; then
    echo "Error: $VENV_DIR has no pip. Install the python3-venv package and retry." >&2
    exit 1
fi

# Keep pip itself current where we can. A stale pip cannot read newer wheel
# metadata, but a failure here is never a reason to abort the install.
if [ -n "$WHEELHOUSE" ]; then
    "$VENV_DIR/bin/pip" install --no-index --find-links "$WHEELHOUSE" --upgrade pip ||
        echo "Note: pip not upgraded (no newer pip wheel in the wheelhouse)"
fi

echo "Installing requirements..."

"$VENV_DIR/bin/pip" install "${PIP_ARGS[@]}" -r "$REQUIREMENTS"

echo "Virtual environment ready."
