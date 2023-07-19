import { grey } from "@mui/material/colors";
import "../main.css";
import { createTheme } from "@mui/material/styles";

const lightTheme = createTheme({
  typography: {
    fontFamily: "HelveticaNeueLight, sans-serif",
    fontWeightRegular: 400,
  },
  // overrides: {
  //   MuiTypography: {
  //     styleOverrides: {
  //       root: {
  //         letterSpacing: "0.05em",
  //       },
  //     },
  //   },
  //   MuiCssBaseline: {
  //     "@global": {
  //       "@font-face": {
  //         fontFamily: "HelveticaNeueLight",
  //         fontStyle: "normal",
  //         fontWeight: 400,
  //         src: `
  //         local('HelveticaNeueLight'),
  //         local('HelveticaNeueLight'),
  //         url(./fonts/HelveticaNeue-Light.otf) format('opentype')
  //       `,
  //       },
  //     },
  //   },
  // },
  palette: {
    grey: {
      // main: grey[200],
      // dark: grey[300],
    },
    primary: {
      dark: "#092037",
      main: "#15314d",
    },
  },
});

const darkTheme = createTheme({
  typography: {
    fontFamily: "HelveticaNeueLight, sans-serif",
    fontWeightRegular: 400,
  },
  // overrides: {
  //   MuiTypography: {
  //     styleOverrides: {
  //       root: {
  //         letterSpacing: "0.05em",
  //       },
  //     },
  //   },
  //   MuiCssBaseline: {
  //     "@global": {
  //       "@font-face": {
  //         fontFamily: "HelveticaNeueLight",
  //         fontStyle: "normal",
  //         fontWeight: 400,
  //         src: `
  //         local('HelveticaNeueLight'),
  //         local('HelveticaNeueLight'),
  //         url(./fonts/HelveticaNeue-Light.otf) format('opentype')
  //       `,
  //       },
  //     },
  //   },
  // },
  palette: {
    mode: "dark",
  },
});

export { darkTheme, lightTheme };
