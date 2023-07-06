// theme components
import { Box, CssBaseline } from "@mui/material";
// import React, { useEffect, useState } from 'react';
import "./App.css";

import "./main.css";

import NavigationBar from "./components/navigationBar";

function App() {
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavigationBar />
    </Box>
  );
}

// Millions of lines of code later...
// const AppBlock = block(App);
// export default AppBlock;

export default App;
