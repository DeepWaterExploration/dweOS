import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Slider,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import { CameraSize, Device, setDevice } from "../../utils/api";

interface SupportingTextProps {
  children: React.ReactNode;
}

const SupportingText: React.FC<SupportingTextProps> = (props) => {
  return (
    <Typography
      sx={{ fontSize: 14 }}
      color='text.secondary'
      gutterBottom
      marginBottom='14px'
    >
      {props.children}
    </Typography>
  );
};

interface DeviceSwitchProps {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  checked: boolean;
  text: string;
  children: React.ReactNode;
}

const DeviceSwitch: React.FC<DeviceSwitchProps> = (props) => {
  return (
    <FormControlLabel
      control={
        <Switch
          name={props.name}
          checked={props.checked}
          onChange={props.onChange}
        />
      }
      label={<Typography color='text.secondary'>{props.text}</Typography>}
    />
  );
};

interface ResolutionMenuProps {
  defaultResolution: string;
  resolutions: CameraSize[];
  onResolutionChange: (res: string) => void;
}

const ResolutionMenu: React.FC<ResolutionMenuProps> = (props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [currentResolution, setCurrentResolution] = useState<string>(
    props.defaultResolution
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    props.onResolutionChange(currentResolution);
  }, [currentResolution, props]);

  return (
    <div>
      <Button
        color='inherit'
        variant='contained'
        id='basic-button'
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup='true'
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        Resolution: {currentResolution}
      </Button>
      <Menu
        id='basic-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {props.resolutions.map((item) => (
          <MenuItem
            key={item}
            onClick={() => {
              setCurrentResolution(item);
              handleClose();
            }}
          >
            {item}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

interface DeviceOptionsProps {
  device: {
    devicePath: string;
    options: {
      bitrate: number;
      h264: boolean;
      vbr: boolean;
    };
    resolutions: string[];
  };
}

const DeviceOptions: React.FC<DeviceOptionsProps> = (props) => {
  const device = props.device.devicePath;

  const [bitrate, setBitrate] = useState(props.device.options.bitrate);
  const [bitrateSlider, setBitrateSlider] = useState(
    props.device.options.bitrate
  );
  const [h264, setH264] = useState(props.device.options.h264);
  const [vbr, setVBR] = useState(props.device.options.vbr);

  useEffect(() => {
    const body = {
      devicePath: device,
      options: {
        bitrate,
        h264,
        vbr,
      },
    };
    // makePostRequest("/options", body);
  }, [bitrate, h264, vbr]);

  return (
    <>
      <SupportingText>
        <span>Bitrate: {bitrateSlider} Mbps</span>
        <Slider
          name='bitrate'
          defaultValue={props.device.options.bitrate}
          disabled={vbr}
          onChangeCommitted={(_, newValue) => {
            setBitrate(newValue as number);
          }}
          onChange={(_, newValue) => {
            setBitrateSlider(newValue as number);
          }}
          style={{ marginLeft: "20px", width: "calc(100% - 25px)" }}
          size='small'
          max={15}
          min={0.1}
          step={0.1}
        />
      </SupportingText>
      <FormGroup>
        <DeviceSwitch
          checked={h264}
          name='h264Switch'
          onChange={(e) => {
            setH264(e.target.checked);
            setVBR(e.target.checked ? false : vbr);
          }}
          text='H.264'
        />
        <DeviceSwitch
          checked={vbr}
          name='vbrSwitch'
          onChange={(e) => {
            setVBR(e.target.checked);
            setH264(e.target.checked ? false : h264);
          }}
          text='VBR (Variable Bitrate)'
        />
      </FormGroup>
    </>
  );
};

interface StreamOptionsProps {
  device: Device;
}

const StreamOptions: React.FC<StreamOptionsProps> = (props) => {
  const [udp, setUDP] = useState(props.device.stream.isStreaming);
  const [hostAddress, setHostAddress] = useState(props.device.stream.host);
  const [port, setPort] = useState(props.device.stream.port);
  const [resolution, setResolution] = useState(props.device.stream.resolution);

  const restartStream = () => {
    // makePostRequest(
    //   "/restartStream",
    //   {
    //     devicePath: device,
    //     stream: {
    //       hostAddress,
    //       port,
    //       resolution,
    //     },
    //   },
    //   xhr => {
    //     const response = JSON.parse(xhr.response);
    //     setPort(response.port);
    //   }
    // );
  };

  useEffect(() => {
    restartStream();
  }, [resolution]);

  useEffect(() => {
    // if (udp) {
    //   makePostRequest(
    //     "/addStream",
    //     {
    //       devicePath: device,
    //       stream: {
    //         hostAddress,
    //         port,
    //       },
    //     },
    //     xhr => {
    //       const response = JSON.parse(xhr.response);
    //       setPort(response.port);
    //     }
    //   );
    // } else {
    //   makePostRequest("/removeStream", {
    //     devicePath: device,
    //   })
    //   ;
    // }
  }, [udp]);

  return (
    <FormGroup>
      <DeviceSwitch
        onChange={(e) => {
          setUDP(e.target.checked);
        }}
        checked={udp}
        name='streamSwitch'
        text='UDP Stream'
      />
      {udp ? (
        <>
          <TextField
            label='address'
            onChange={(e) => {
              setHostAddress(e.target.value);
            }}
            variant='standard'
            value={hostAddress}
          />
          <TextField
            label='port'
            onChange={(e) => {
              setPort(Number(e.target.value));
            }}
            variant='standard'
            type='number'
            value={port}
          />
          <div style={{ marginTop: "20px" }}>
            <ResolutionMenu
              onResolutionChange={(res) => {
                setResolution(res);
              }}
              defaultResolution={resolution}
              resolutions={
                props.device.cameras.filter(
                  (camera) =>
                    props.device.stream.device_path === camera.device_path
                )[0].formats
              }
            />
          </div>
          <Button
            color='grey'
            variant='contained'
            style={{ marginTop: "20px" }}
            onClick={restartStream}
          >
            Restart Stream
          </Button>
        </>
      ) : undefined}
    </FormGroup>
  );
};

interface Control {
  type: "int" | "bool" | "menu";
  name: string;
  id: number;
  value: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  menu?: string[];
}

interface CameraControlsProps {
  controls: Control[];
  devicePath: string;
}

const CameraControls: React.FC<CameraControlsProps> = (props) => {
  const { controls, devicePath } = props;
  const [controlsCollapsed, setControlsCollapsed] = useState(true);

  return (
    <>
      <div style={{ marginTop: "25px" }}>
        <span>Camera Controls</span>
        <IconButton onClick={() => setControlsCollapsed(!controlsCollapsed)}>
          {controlsCollapsed ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
        </IconButton>
        <Divider />
        <Collapse in={!controlsCollapsed}>
          <FormGroup style={{ marginTop: "25px" }}>
            {controls.map((control) => {
              switch (control.type) {
                case "int": {
                  const { min, max, step, name, id } = control;
                  const defaultValue = control.value;
                  const [controlValue, setControlValue] = useState<number>(
                    defaultValue as number
                  );

                  useEffect(() => {
                    makePostRequest("/setControl", {
                      devicePath,
                      id,
                      value: controlValue,
                    });
                  }, [controlValue]);

                  return (
                    <>
                      <span>{name}</span>
                      <Slider
                        onChangeCommitted={(_, newValue) => {
                          setControlValue(newValue as number);
                        }}
                        name={`control-${id}`}
                        min={min}
                        max={max}
                        step={step}
                        defaultValue={defaultValue as number}
                        style={{
                          marginLeft: "20px",
                          width: "calc(100% - 25px)",
                        }}
                      />
                    </>
                  );
                }
                case "bool": {
                  let { name, id } = control;
                  const defaultValue = control.value;
                  if (name.includes("White Balance")) {
                    name = "AI TrueColor Technology™";
                  }
                  const [controlValue, setControlValue] = useState<boolean>(
                    defaultValue as boolean
                  );

                  useEffect(() => {
                    makePostRequest("/setControl", {
                      devicePath,
                      id,
                      value: controlValue ? 1 : 0,
                    });
                  }, [controlValue]);

                  return (
                    <>
                      <span>{name}</span>
                      <Switch
                        onChange={(_, checked) => {
                          setControlValue(checked);
                        }}
                        name={`setDeviceNamecontrol-${id}`}
                        defaultChecked={defaultValue == 1}
                      />
                    </>
                  );
                }
                case "menu": {
                  const { menu, name, id } = control;
                  const defaultValue = menu[control.value as number];
                  const [controlValue, setControlValue] = useState<string>(
                    defaultValue as string
                  );

                  useEffect(() => {
                    makePostRequest("/setControl", {
                      devicePath,
                      id,
                      value: controlValue,
                    });
                  }, [controlValue]);

                  return (
                    <>
                      <span>{name}</span>
                      <select
                        value={controlValue}
                        onChange={(e) => setControlValue(e.target.value)}
                      >
                        {menu.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </>
                  );
                }
              }
            })}
          </FormGroup>
        </Collapse>
      </div>
    </>
  );
};

const LineBreak: React.FC = () => {
  return <br></br>;
};

export interface DeviceCardProps {
  key: number;
  device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = (props) => {
  const controls = props.device.controls;
  console.log(controls);

  const deviceOptions = <DeviceOptions device={props.device} />;
  const deviceWarning = null;

  const cameraControls = (
    <CameraControls controls={controls} devicePath={props.device.info.path} />
  );

  return (
    <Grid
      item
      xs={12}
      lg={7}
      xl={6}
      flexWrap='wrap'
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Card sx={{ minWidth: 500, boxShadow: 3, textAlign: "left" }}>
        <CardHeader
          action={deviceWarning}
          title={props.device.info.name}
          subheader={
            <>
              {props.device.info.manufacturer
                ? `Manufacturer: ${props.device.info.manufacturer}`
                : "Manufacturer: DeepWater Exploration Inc"}
              <LineBreak />
              {props.device.info.model
                ? `Model: ${props.device.info.model}`
                : "Model: DWE-EHDUSBR2"}
              <LineBreak />
              <TextField
                onChange={(e) => {
                  props.device.info.name = e.target.value;
                  setDevice(
                    props.device.stream.device_path,
                    props.device.info.name
                  );
                  // makePostRequest("/setDeviceName", {
                  //   devicePath: props.device.stream.device_path,
                  //   name: e.target.value,
                  // });
                }}
                helperText='Device Nickname'
                placeholder='Device Nickname'
                variant='standard'
                defaultValue={props.device.info.name}
              ></TextField>
            </>
          }
        />
        <CardContent>
          <SupportingText>
            Device: {props.device.stream.device_path}
          </SupportingText>
          {deviceOptions}
          <StreamOptions device={props.device} />
          {cameraControls}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default DeviceCard;
