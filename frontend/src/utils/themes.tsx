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
          url(./fonts/HelveticaNeue-Light.otf) format('opentype')
        `,
        },
      },
    },
    MuiAccordion: {
      root: {
        "&$expanded": {
          margin: "auto", // Centers the Accordion when expanded
        },
      },
    },
    MuiAccordionSummary: {
      content: {
        "&$expanded": {
          margin: "12px 0", // Adds extra spacing inside the AccordionSummary when expanded
        },
      },
    },
    MuiAccordionDetails: {
      root: {
        padding: 16, // Adds padding inside the AccordionDetails
      },
    },
  },
};

const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: "light",
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
