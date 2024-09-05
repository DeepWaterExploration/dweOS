import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import React from "react";

interface DeviceSwitchProps {
    onChange: () => void;
    name: string;
    checked: boolean;
    text: string;
    disabled: boolean;
}

export const DeviceSwitch: React.FC<DeviceSwitchProps> = (props) => {
    return (
        <FormControlLabel
            control={
                <Switch
                    name={props.name}
                    checked={props.checked}
                    onClick={props.onChange}
                    disabled={props.disabled}
                />
            }
            label={<Typography color='text.secondary'>{props.text}</Typography>}
        />
    );
};
