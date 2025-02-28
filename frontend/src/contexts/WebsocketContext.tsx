import React from "react";
import { Socket } from "socket.io-client";

// Global State
const WebsocketContext = React.createContext<{
    socket: Socket;
    connected: boolean;
}>(null);

export default WebsocketContext;
