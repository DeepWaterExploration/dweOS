import os
import logging

class SystemManager:
    '''
    Simple class to manage the restarting and shutting down of the system
    '''

    REBOOT_COMMAND = 'reboot now'
    SHUTDOWN_COMMAND = 'shutdown now'

    def __init__(self) -> None:
        pass

    def restart_system(self):
        logging.info('Restarting system')
        os.system(self.REBOOT_COMMAND)
    
    def shutdown_system(self):
        logging.info('Shutting down system')
        os.system(self.SHUTDOWN_COMMAND)
