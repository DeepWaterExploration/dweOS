import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// routes to different pages
import { routes, RouteType } from "../routes";

interface GetRoutesProps {
  routes: RouteType[];
}

const GetRoutes = ({ routes }: GetRoutesProps): JSX.Element => {
  return (
    <Routes>
      {routes.map(route => {
        if (route.route && route.component) {
          return (
            <Route path={route.route} element={route.component} key={route.key} />
          );
        }
        return null; // Add a default return value if the if condition is not met
      })}
    </Routes>
  );
};

const NavigationRoutes = (): JSX.Element => {
  return <GetRoutes routes={routes} />;
};

export default NavigationRoutes;
