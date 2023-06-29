// import React, { useEffect, useState } from 'react';
import { block } from "million/react";
import "./App.css";

import "./main.css";

// react-router components
import // BrowserRouter as Router,
// Switch,
// Route,
// Link,
// useLocation,
"react-router-dom";

import NavigationBar from "./components/navigationBar";

// theme components
import { Box, Container, CssBaseline, Grid } from "@mui/material";

function App() {
  // const { pathname } = useLocation()

  // Setting the dir attribute for the body element
  // useEffect(() => {
  //   document.body.setAttribute('dir', direction)
  // }, [direction])

  // // Move page to top when changing routes
  // useEffect(() => {
  //   document.documentElement.scrollTop = 0
  //   document.scrollingElement.scrollTop = 0
  // }, [pathname])

  return (
    // <ThemeProvider theme={theme}>
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
    // </ThemeProvider>
  );
  // return Dashboard({
  //   props: this.props,
  //   state: this.state,
  //   updateTheme: this.updateTheme,
  //   resetSettings: this.resetSettings,
  // })
}

// refreshCards() {
//   makePostRequest('getCards', {}).then((response) => {
//     this.setState({
//       exploreHD_cards: response.exploreHD_cards,
//       other_cards: response.other_cards,
//     })
//   })
// }

// componentDidMount() {
//   this.refreshCards()

//   const socket = io('http://localhost:3000')

//   socket.on('update', (data) => {
//     console.log(data)
//     this.refreshCards()
//   })
// }

// const AppBlock = block(App);
const AppBlock = App;

export default AppBlock;

// refreshCards() {
//   makePostRequest('getCards', {}).then((response) => {
//     this.setState({
//       exploreHD_cards: response.exploreHD_cards,
//       other_cards: response.other_cards,
//     })
//   })
// }

// componentDidMount() {
//   this.refreshCards()

//   const socket = io('http://localhost:3000')
