import { TOUR_STEP_IDS } from "@/components/tour/tour-lib/tour-constants";
import WebsocketContext from "@/contexts/WebsocketContext";
import { useContext } from "react";
import NotConnected from "../not-connected";
import WiredConfig from "./wired/wired-config";
import WirelessConfig from "./wireless/wireless-config";

const NetworkLayout = () => {
  const { connected } = useContext(WebsocketContext)!;

  if (!connected) {
    return (
      <div className="h-full w-full">
        <NotConnected />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      <div
        data-tour-id={TOUR_STEP_IDS.NETWORKING_PAGE}
        className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(380px,1fr))] items-start"
      >
        <WiredConfig />
        <WirelessConfig />
      </div>
    </div>
  );
};

export default NetworkLayout;
