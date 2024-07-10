import ReactDOM from "react-dom/client";

import AppBlock from "./App";
import "./index.css";
import React from "react";

const rootElement = document.getElementById("root");
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<AppBlock />);
} else {
    console.error("Unable to find root element with ID 'root'");
}
