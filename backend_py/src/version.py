"""
version.py

Resolves the dweOS version. frontend/package.json is the single source of truth:
bump_version.sh sets it for releases and the preview workflow for preview builds.
create_release.sh ships it in the release, next to the frontend build.
"""

import json
import logging
from pathlib import Path

# backend_py/src/version.py -> repository (or release) root
PACKAGE_JSON_PATH = Path(__file__).resolve().parents[2] / "frontend" / "package.json"

UNKNOWN_VERSION = "unknown"


def _read_version() -> str:
    try:
        with open(PACKAGE_JSON_PATH) as f:
            return json.load(f)["version"]
    except (OSError, ValueError, KeyError) as e:
        logging.getLogger("dwe_os_2.version").warning(
            f"Could not read the dweOS version from {PACKAGE_JSON_PATH}: {e}"
        )
        return UNKNOWN_VERSION


VERSION = _read_version()
