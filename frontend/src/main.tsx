import React from "react";
import ReactDOM from "react-dom/client";

import AppBlock from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppBlock />
    </React.StrictMode>
  );
} else {
  console.error("Unable to find root element with ID 'root'");
}
