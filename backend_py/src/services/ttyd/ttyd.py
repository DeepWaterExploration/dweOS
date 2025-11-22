import subprocess
from typing import Optional

class TTYDManager:

    TTYD_CMD = ['ttyd', '-p', '7681', 'login']

    def __init__(self) -> None:
        self._process: Optional[subprocess.Popen] = None

    def start(self) -> None:
        if self._process:
            return

        self._process = subprocess.Popen(self.TTYD_CMD, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def kill(self):
        if self._process:
            self._process.kill()
