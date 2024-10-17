import subprocess
import pwd

class TTYDManager:

    TTYD_CMD = ['ttyd', '-p', '7681', '-u', '1000', '-g', '1000', 'bash', '--rcfile', f'/home/{pwd.getpwuid(1000).pw_name}/.bashrc']

    def __init__(self) -> None:
        self._process: subprocess.Popen | None = None

    def start(self) -> None:
        if self._process:
            return

        self._process = subprocess.Popen(self.TTYD_CMD, user=1000, group=1000, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def kill(self):
        self._process.kill()
