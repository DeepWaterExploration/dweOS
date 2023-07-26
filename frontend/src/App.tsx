// theme components
import { Alert, AlertColor, Box, CssBaseline, Snackbar } from "@mui/material";
// import React, { useEffect, useState } from 'react';
import "./App.css";

import "./main.css";

import { SnackbarProvider } from "notistack";

import NavigationBar from "./components/navigationBar";

function App() {
  return (
    <SnackbarProvider autoHideDuration={4000} maxSnack={6}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <NavigationBar />
      </Box>
    </SnackbarProvider>
  );
}

// Millions of lines of code later...
// const AppBlock = block(App);
// export default AppBlock;

export default App;
