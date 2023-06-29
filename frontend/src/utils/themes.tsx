import "../main.css";
import { createTheme } from "@mui/material/styles";

const palette = {
  // numbered colors follow this rule:
  //  > higher number - darker
  //  > lower number - lighter
  main: {
    primary: "#1CA3D9",
    3: "#105F7E",
    2: "#157AA2",
    1: "#46BAE7",
    0: "#6FC9EC",
  },
  black: {
    primary: "#1E1E1E",
    2: "#666",
    1: "#333",
    0: "#0A0A0A",
  },
  white: {
    primary: "#FFF",
    2: "#F5F5F5",
    1: "#EEE",
    0: "#CCC",
  },
};

const darkTheme = createTheme({
  typography: {
    fontFamily: "HelveticaNeueLight, sans-serif",
    fontWeightRegular: 400,
  },
  palette: {
    // Define your palette options here
    background: {
      default: palette.black.primary,
    },
    text: {
      primary: palette.white.primary,
    },
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          letterSpacing: "0.05em",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.black[1],
          position: "static",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: palette.black[2],
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          backgroundColor: palette.black[1],
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          color: palette.white.primary,
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: palette.black[2],
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: palette.black[2],
          BorderBottom: palette.black[2],
        },
      },
    },
  },
});

const lightTheme = createTheme({
  typography: {
    fontFamily: "HelveticaNeueLight, sans-serif",
    fontWeightRegular: 400,
  },
  palette: {
    background: {
      default: palette.white.primary,
    },
    text: {
      primary: palette.black.primary,
    },
    primary: {
      main: palette.main.primary,
    },
    grey: {
      100: palette.white[1],
      200: palette.white[0],
      300: palette.black[1],
      400: palette.black[0],
    },
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          letterSpacing: "0.05em",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.white[1],
          position: "static",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: palette.white[2],
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          backgroundColor: palette.white[1],
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          color: palette.black.primary,
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: palette.white[2],
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: palette.white[2],
          borderBottom: palette.white[2],
        },
      },
    },
  },
});

export { palette, darkTheme, lightTheme };
