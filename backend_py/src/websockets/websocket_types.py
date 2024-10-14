from dataclasses import dataclass
from typing import Dict

@dataclass
class Message:
    """
    Represents a message containing an event name and associated data.

    Attributes:
        event_name (str): The name of the event associated with the message.
        data (Dict): A dictionary containing the data associated with the message.

    Methods:
        to_dict: Returns a dict in the format <event_name>: <data>
    """
    event_name: str
    data: Dict

    def to_dict(self) -> Dict:
        return {
            'event_name': self.event_name,
            'data': self.data
        }