"""
update_manager.py

Lists the dweOS releases on GitHub and installs one with install.sh
The install runs in its own systemd unit, since install.sh stops and restarts the
dwe_os_2 service, which would otherwise kill it partway through
"""

import json
import logging
import os
import re
import subprocess
import threading
import urllib.request

from ...models import ReleaseModel, UpdateStateEnum, UpdateStatusModel


class UpdateInProgressError(Exception):
    pass


class UpdateManager:
    RELEASES_URL = (
        "https://api.github.com/repos/DeepwaterExploration/dweOS/releases?per_page=50"
    )
    INSTALL_SCRIPT_URL = (
        "https://raw.githubusercontent.com/DeepwaterExploration/dweOS/main/install.sh"
    )
    UNIT_NAME = "dwe_os_2_update"
    TAG_REGEX = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
    REQUEST_TIMEOUT = 10
    LOG_LINES = 200

    def __init__(self, data_dir: str) -> None:
        self.logger = logging.getLogger("dwe_os_2.UpdateManager")
        self.log_path = os.path.join(os.path.abspath(data_dir), "update.log")
        self._lock = threading.Lock()

    def get_releases(self) -> list[ReleaseModel]:
        request = urllib.request.Request(
            self.RELEASES_URL,
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "dweOS",
            },
        )
        with urllib.request.urlopen(  # noqa: S310 (fixed https URL)
            request, timeout=self.REQUEST_TIMEOUT
        ) as response:
            releases = json.loads(response.read())

        return [
            ReleaseModel(
                tag=release["tag_name"],
                name=release.get("name") or release["tag_name"],
                published_at=release.get("published_at") or "",
                prerelease=release.get("prerelease", False),
                notes=release.get("body") or "",
                url=release.get("html_url", ""),
            )
            for release in releases
            if not release.get("draft", False)
        ]

    def get_status(self) -> UpdateStatusModel:
        return UpdateStatusModel(state=self._get_state(), log=self._read_log())

    def start_update(self, tag: str) -> None:
        if not self.TAG_REGEX.match(tag):
            raise ValueError(f"Invalid release tag: {tag}")

        with self._lock:
            if self._get_state() == UpdateStateEnum.RUNNING:
                raise UpdateInProgressError("An update is already running")

            self.logger.info(f"Updating dweOS to {tag}")

            # A failed unit keeps its name until it is reset
            subprocess.run(
                ["systemctl", "reset-failed", self.UNIT_NAME],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

            with open(self.log_path, "w", encoding="utf-8") as f:
                f.write(f"Updating dweOS to {tag}\n")

            subprocess.run(
                [
                    "systemd-run",
                    f"--unit={self.UNIT_NAME}",
                    "--description=dweOS update",
                    f"--property=StandardOutput=append:{self.log_path}",
                    f"--property=StandardError=append:{self.log_path}",
                    "/bin/bash",
                    "-c",
                    'set -o pipefail; curl -fsSL "$1" | bash -s -- "$2"',
                    "bash",
                    self.INSTALL_SCRIPT_URL,
                    tag,
                ],
                check=True,
                capture_output=True,
            )

    def _get_state(self) -> UpdateStateEnum:
        try:
            result = subprocess.run(
                [
                    "systemctl",
                    "show",
                    self.UNIT_NAME,
                    "--property=ActiveState",
                    "--value",
                ],
                capture_output=True,
                text=True,
            )
        except FileNotFoundError:
            return UpdateStateEnum.IDLE

        state = result.stdout.strip()
        if state in ("active", "activating", "deactivating", "reloading"):
            return UpdateStateEnum.RUNNING
        if state == "failed":
            return UpdateStateEnum.FAILED
        return UpdateStateEnum.IDLE

    def _read_log(self) -> str:
        try:
            with open(self.log_path, encoding="utf-8", errors="replace") as f:
                return "".join(f.readlines()[-self.LOG_LINES :])
        except FileNotFoundError:
            return ""
