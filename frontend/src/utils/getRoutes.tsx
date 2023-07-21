import { Box, Container, Grid } from "@mui/material";
import { Route, Routes } from "react-router-dom";

// routes to different pages
import { routes } from "../routes";
import { RouteItem } from "../types/types";

interface GetRoutesProps {
  routes: RouteItem[];
}

const GetRoutes = ({ routes }: GetRoutesProps): JSX.Element => {
  return (
    <Routes>
      {routes.map((route) => {
        if (route.route && route.component) {
          return (
            <Route
              path={route.route}
              element={route.component}
              key={route.key}
            />
          );
        }
        return null; // Add a default return value if the if condition is not met
      })}
    </Routes>
  );
};

interface NavigationRoutesProps {
  theme: string;
}

const NavigationRoutes: React.FC<NavigationRoutesProps> = () => {
  return (
    <Box
      component='main'
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
        paddingTop: "7em",
      }}
    >
      {/* <Toolbar /> */}
      {/* DeviceCards */}
      <div style={{ minHeight: "14px" }} />
      <div style={{ height: "calc(100vh - 14px)" }}>
        <GetRoutes routes={routes} />
      </div>
    </Box>
  );
};

export default NavigationRoutes;
