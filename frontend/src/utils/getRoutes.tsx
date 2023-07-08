import { Box, Container, Grid } from "@mui/material";
import { Route, Routes } from "react-router-dom";

// routes to different pages
import { RouteType, routes } from "../routes";

interface GetRoutesProps {
  routes: RouteType[];
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
      }}
    >
      {/* <Toolbar /> */}
      <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3} style={{ paddingTop: "3.5em" }}>
          {/* DeviceCards */}
          <div style={{ minHeight: "14px" }} />
          <div style={{ height: "calc(100vh - 14px)" }}>
            <GetRoutes routes={routes} />
          </div>
        </Grid>
      </Container>
    </Box>
  );
};

export default NavigationRoutes;
