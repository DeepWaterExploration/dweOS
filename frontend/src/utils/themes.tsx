import "../main.css";
import { createTheme } from "@mui/material/styles";

const themeOptions = (mode: "light" | "dark") => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          // palette values for light mode
          // primary: "#FFFFFF",
          // secondary: "#CCCCCC",
          primary: {
            main: "#094860",
          },
          text: {
            primary: "#000000",
            secondary: "#696969",
            tertiary: "#746BAE",
          },
        }
      : {
          // // palette values for dark mode
          primary: {
            main: "#46BAE7",
          },
          background: {
            default: "#303030",
            paper: "#1E1E1E",
          },
          text: {
            primary: "#EEEEEE",
            secondary: "#CCCCCC",
            tertiary: "#46BAE7",
          },
        }),
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "#094860",
          color: "#FFFFFF",
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        // Change the default color for the Toolbar component
        root: {
          backgroundColor: `${
            mode === "light" ? "#094860" : "#1E1E1E"
          } !important`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        // Change the default color for the Drawer component
        paper: {
          backgroundColor: `${
            mode === "light" ? "#CCCCCC" : "#000000"
          } !important`,
        },
      },
    },
  },
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
});

const dweTheme = (mode: "light" | "dark") => createTheme(themeOptions(mode));

export default dweTheme;
