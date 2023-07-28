import { Card, CardContent } from "@mui/material";

import { WiFiNetwork } from "./types";

export interface NetworkHistoryCardProps {
  wifiStatus?: boolean;
  connectedNetwork?: WiFiNetwork;
  networks?: WiFiNetwork[];
}

const NetworkHistoryCard: React.FC<NetworkHistoryCardProps> = (props) => {
  return (
    <Card
      sx={{ minWidth: 512, boxShadow: 3, textAlign: "left", margin: "20px" }}
    >
      {/* <CardHeader
        action={deviceWarning}
        title={props.device.info.name}
        subheader={
          <>
            {`Manufacturer: ${props.device.info.manufacturer}`}
            <LineBreak />
            {`Model: ${props.device.info.model}`}
            <LineBreak />
            {`USB ID: ${props.device.info.usbInfo}`}
            <LineBreak />
            <TextField
              sx={{ top: 10 }}
              onChange={(e) => {
                props.device.info.name = e.target.value;
                // setDevice(
                //   props.device.stream.device_path,
                //   props.device.info.name
                // );
                // makePostRequest("/setDeviceName", {
                //   devicePath: props.device.stream.device_path,
                //   name: e.target.value,
                // });
              }}
              helperText='Device Nickname'
              placeholder='Device Nickname'
              variant='standard'
              defaultValue={props.device.info.nickname}
            ></TextField>
          </>
        }
      /> */}
      <CardContent>
        {/* {/* {props.device.stream.device_path ? (
          <SupportingText>
            Device: {props.device.stream.device_path}
          </SupportingText>
        ) : (
          <></>
        )} * /}
        {deviceOptions}
        <StreamOptions device={props.device} />
        {cameraControls} */}
      </CardContent>
    </Card>
  );
};

export default NetworkHistoryCard;
