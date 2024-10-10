import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import "./App.css";
import "./main.css";
import { SnackbarProvider } from "notistack";

import NavigationBar from "./components/NavigationBar";
import React from "react";

function App() {
    return (
        <SnackbarProvider autoHideDuration={3000} maxSnack={4}>
            <Box sx={{ display: "flex" }}>
                <CssBaseline>
                    <NavigationBar />
                </CssBaseline>
            </Box>
        </SnackbarProvider>
    );
}

export default App;
