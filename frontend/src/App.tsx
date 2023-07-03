// theme components
import { Box, Container, CssBaseline, Grid } from "@mui/material";
// import React, { useEffect, useState } from 'react';
import "./App.css";

import "./main.css";

import NavigationBar from "./components/navigationBar";

function App() {
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavigationBar />
      <Box
        component='main'
        sx={{
          backgroundColor: theme =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: "100vh",
          overflow: "auto",
        }}
      >
        {/* <Toolbar /> */}
        <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3} style={{ paddingTop: "16px" }}>
            {/* DeviceCards */}
            <div style={{ minHeight: "14px" }} />
            <div style={{ height: "calc(100vh - 14px)" }}>
              {/* <DevicesContainer>
                  {exploreHD_cards}
                  {other_cards}
                </DevicesContainer> */}
            </div>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

// Millions of lines of code later...
// const AppBlock = block(App);
// export default AppBlock;

export default App;
