import React from "react";
import { Socket } from "socket.io-client";

// Global State
const WebsocketContext = React.createContext<{
    socket: Socket | undefined;
    connected: boolean;
} | undefined>(undefined);

export default WebsocketContext;