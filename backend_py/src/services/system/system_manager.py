import logging
import subprocess


class SystemManager:
    REBOOT_COMMAND = ["reboot", "now"]
    SHUTDOWN_COMMAND = ["shutdown", "now"]

    def __init__(self) -> None:
        self.logger = logging.getLogger("dwe_os_2.SystemManager")

    def restart_system(self):
        self.logger.info("Restarting system")
        try:
            subprocess.run(self.REBOOT_COMMAND, check=True)
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to restart system: {e}")

    def shutdown_system(self):
        self.logger.info("Shutting down system")
        try:
            subprocess.run(self.SHUTDOWN_COMMAND, check=True)
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to shutdown system: {e}")
