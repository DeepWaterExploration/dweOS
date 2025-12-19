"""
ttyd.py

Controls the terminal provided in DWE_OS
"""

import subprocess

class TTYDManager:
    
    # TTYD_CMD = ['ttyd', '-p', '7681', 'login']
    # For dev mode comment out above, comment in below:
    TTYD_CMD = ['ttyd', '-W', '-a', '-p', '7681', 'bash']   

    def __init__(self) -> None:
        self._process: subprocess.Popen | None = None

    def start(self) -> None:
        if self._process:
            return

        self._process = subprocess.Popen(self.TTYD_CMD, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def kill(self):
        if self._process:
            self._process.kill()
