import os
import logging


class SystemManager:
    """
    Simple class to manage the restarting and shutting down of the system
    """

    REBOOT_COMMAND = "reboot now"
    SHUTDOWN_COMMAND = "shutdown now"

    def __init__(self) -> None:
        self.logger = logging.getLogger("dwe_os_2.SystemManager")

    def restart_system(self):
        self.logger.info("Restarting system")
        os.system(self.REBOOT_COMMAND)

    def shutdown_system(self):
        self.logger.info("Shutting down system")
        os.system(self.SHUTDOWN_COMMAND)
