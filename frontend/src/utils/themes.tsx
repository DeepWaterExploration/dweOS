import { grey } from "@mui/material/colors";
import "../main.css";
import { createTheme } from "@mui/material/styles";

const commonThemeOptions = {
  typography: {
    fontFamily: "HelveticaNeueLight, sans-serif",
    fontWeightRegular: 400,
  },
  overrides: {
    MuiTypography: {
      styleOverrides: {
        root: {
          letterSpacing: "0.05em",
        },
      },
    },
    MuiCssBaseline: {
      "@global": {
        "@font-face": {
          fontFamily: "HelveticaNeueLight",
          fontStyle: "normal",
          fontWeight: 400,
          src: `
          local('HelveticaNeueLight'),
          local('HelveticaNeueLight'),
          url(./fonts/HelveticaNeue-Light.otf) format('opentype')
        `,
        },
      },
    },
  },
};

const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: "light",
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
  ...commonThemeOptions,
  palette: {
    mode: "dark",
  },
});

export { darkTheme, lightTheme };
