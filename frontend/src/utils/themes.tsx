import { amber, deepOrange, grey } from "@mui/material/colors";
import "../main.css";
import { createTheme } from "@mui/material/styles";

const customColors = {
  primary: '#007bff', // Change this to your desired primary color
  secondary: '#ff5722', // Change this to your desired secondary color
};

const themeOptions = (mode: "light" | "dark") =>
  ({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            // palette values for light mode
            // primary: "#FFFFFF",
            // secondary: "#CCCCCC",
            divider: amber[200],
            text: {
              primary: grey[900],
              secondary: grey[800],
            },
          }
        : {


            // // palette values for dark mode
            // primary: {
            //   main: '#46BAE7',
            // },
            // // background: {
            // //   default: "#303030",
            // //   paper: "#1E1E1E",
            // // },
            // text: {
            //   primary: "#FFFFFF",
            //   secondary: "#CCCCCC",
            // },
          }),
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: '#094860', // Your custom background color
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          // Change the default color for the Toolbar component
          root: {
            backgroundColor: `${mode === "light" ? "#094860" : "#1E1E1E"} !important`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          // Change the default color for the Drawer component
          paper: {
            backgroundColor: `${mode === "light" ? "#CCCCCC" : "#000000"} !important`,
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

const dweTheme = (mode: "light" | "dark") => (createTheme(themeOptions(mode)));

export default dweTheme;
