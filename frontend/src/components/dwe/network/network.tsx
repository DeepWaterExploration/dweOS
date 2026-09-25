import { useContext } from "react";
import WebsocketContext from "@/contexts/WebsocketContext";
import FeaturesContext from "@/contexts/FeaturesContext";
import NotConnected from "../not-connected";
import FeatureNotSupported from "../app/not-supported";
import { Markdown } from "../markdown";
import WiredConfig from "./wired/wired-config";
import WirelessConfig from "./wireless/wireless-config";

const NETWORK_NOT_SUPPORTED_MSG = `
Network management is not currently enabled in the backend.

- If you installed dweOS yourself, please enable it by removing \`--no-wifi\`.
- If you have installed dweOS as an extension on BlueOS, please use the network settings in BlueOS
`.trim();

const NetworkLayout = () => {
  const { connected } = useContext(WebsocketContext)!;
  const features = useContext(FeaturesContext);

  if (!connected) {
    return (
      <div className="h-full w-full">
        <NotConnected />
      </div>
    );
  }

  if (!features?.wifi) {
    return (
      <FeatureNotSupported>
        <div className="mt-3">
          <Markdown>{NETWORK_NOT_SUPPORTED_MSG}</Markdown>
        </div>
      </FeatureNotSupported>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(380px,1fr))] items-start">
        <WiredConfig />
        <WirelessConfig />
      </div>
    </div>
  );
};

export default NetworkLayout;
