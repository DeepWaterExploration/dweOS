"""
ttyd.py

Controls the terminal provided in DWE_OS
"""

import subprocess

class TTYDManager:
    
    TTYD_CMD = ['ttyd', '-p', '7681', 'login']

    def __init__(self, is_dev_mode=False) -> None:
        self._process: subprocess.Popen | None = None

        if is_dev_mode:
            self.TTYD_CMD = ['ttyd', '-W', '-a', '-p', '7681', 'bash']

    def start(self) -> None:
        if self._process:
            return

        self._process = subprocess.Popen(self.TTYD_CMD, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def kill(self):
        if self._process:
            self._process.kill()
