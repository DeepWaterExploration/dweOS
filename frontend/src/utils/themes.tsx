import { amber, deepOrange, grey } from "@mui/material/colors";
import "../main.css";
import { createTheme } from "@mui/material/styles";

const themeOptions = (mode: "light" | "dark") =>
  ({
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
    palette: {
      mode,
      ...(mode === "light"
        ? {
            // palette values for light mode
            primary: amber,
            divider: amber[200],
            text: {
              primary: grey[900],
              secondary: grey[800],
            },
          }
        : {
            // palette values for dark mode
            primary: deepOrange,
            divider: deepOrange[700],
            background: {
              default: deepOrange[900],
              paper: deepOrange[900],
            },
            text: {
              primary: "#fff",
              secondary: grey[500],
            },
          }),
    },
  });

const dweTheme = (mode: "light" | "dark") => (createTheme(themeOptions(mode)));

export default dweTheme;
