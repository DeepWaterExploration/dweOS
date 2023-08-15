import { Box, CssBaseline } from "@mui/material";
import "./App.css";
import "./main.css";
import { SnackbarProvider } from "notistack";

import NavigationBar from "./components/navigationBar";

function App() {
  return (
    <SnackbarProvider autoHideDuration={3000} maxSnack={4}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline>
          <NavigationBar />
        </CssBaseline>
      </Box>
    </SnackbarProvider>
  );
}

// Millions of lines of code later...
// const AppBlock = block(App);
// export default AppBlock;

export default App;
