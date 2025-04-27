import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import OverviewLayout from "./components/Overview";
import DeviceListLayout from "./components/dwe/cameras/device-list";
import { RecordingBrowser } from "./components/RecordingBrowser";
import PreferencesLayout from "./components/dwe/preferences/preferences";
import { LogViewer } from "./components/dwe/log-page/log-viewer";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <OverviewLayout /> },
      { path: "/cameras", element: <DeviceListLayout /> },
      { path: "/videos", element: <RecordingBrowser /> },
      { path: "/preferences", element: <PreferencesLayout /> },
      { path: "/logs", element: <LogViewer /> },
    ],
  },
]);
