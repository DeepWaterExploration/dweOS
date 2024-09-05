import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import AccordionDetails from "@mui/material/AccordionDetails";
import FormGroup from "@mui/material/FormGroup";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import PopupState, { bindTrigger } from "material-ui-popup-state";
import React, { useContext, useState } from "react";
import { Control, controlType, Device } from "../types/types";
import { setUVCControl } from "../utils/api";
import { useDidMountEffect } from "../utils/utils";
import { LineBreak } from "./LineBreak";
import DeviceContext from "../contexts/DeviceContext";

interface CameraControlsProps {
    device: Device;
}

interface ControlState {
    control_id: number;
    name: string;
    setControlValue:
        | ((value: number) => void)
        | ((value: boolean) => void)
        | ((value: string) => void);
    default_value: number | string | boolean;
    type: controlType;
}

export const CameraControls: React.FC<CameraControlsProps> = (props) => {
    const { device } = useContext(DeviceContext) as { device: Device };

    const controls = props.device.controls;
    const bus_info = props.device.bus_info;

    // FIXME: for default controls
    const setStatesList: ControlState[] = [];

    return (
        <Accordion
            style={{
                width: "100%",
                marginTop: "20px",
                visibility: "visible",
                // border: "1px solid rgb(117, 117, 117)",
                // borderRadius: "5px",
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls='panel2a-content'
                id='panel2a-header'
            >
                <Typography fontWeight='800'>Camera Controls</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <FormGroup style={{ marginTop: "20px" }}>
                    {controls.map((control, index) => {
                        // Extremely Hacky Fix for Auto Exposure: Change in backend later
                        if (
                            control.name.includes("Auto Exposure") &&
                            control.flags.control_type === controlType.MENU
                        ) {
                            control.flags.control_type = controlType.BOOLEAN;
                        }
                        switch (control.flags.control_type) {
                            case controlType.INTEGER: {
                                const { name, control_id, value } = control;
                                const {
                                    min_value,
                                    max_value,
                                    step,
                                    default_value,
                                } = control.flags;
                                const [controlValue, setControlValue] =
                                    useState<number>(value as number);
                                const [
                                    controlValueSlider,
                                    setControlValueSlider,
                                ] = useState<number>(value as number);
                                setStatesList.push({
                                    control_id,
                                    name,
                                    setControlValue,
                                    default_value,
                                    type: control.flags.control_type,
                                } as ControlState);

                                useDidMountEffect(() => {
                                    device.controls.find(
                                        (control) =>
                                            control.control_id == control_id
                                    ).value = controlValue;
                                    setUVCControl(
                                        bus_info,
                                        controlValue,
                                        control_id
                                    );
                                    setControlValueSlider(controlValue);
                                }, [controlValue]);

                                return (
                                    <React.Fragment key={index}>
                                        <span key={"label" + index}>
                                            {name}: {controlValueSlider}
                                        </span>
                                        <Slider
                                            onChangeCommitted={(
                                                _,
                                                newValue
                                            ) => {
                                                device.controls.find(
                                                    (control) =>
                                                        control.control_id ==
                                                        control_id
                                                ).value = controlValue;
                                                setControlValue(
                                                    newValue as number
                                                );
                                            }}
                                            onChange={(_, newValue) => {
                                                device.controls.find(
                                                    (control) =>
                                                        control.control_id ==
                                                        control_id
                                                ).value = controlValue;
                                                setControlValueSlider(
                                                    newValue as number
                                                );
                                            }}
                                            name={`control-${control_id}`}
                                            min={min_value}
                                            max={max_value}
                                            step={step}
                                            value={controlValueSlider}
                                            defaultValue={value as number}
                                            style={{
                                                marginLeft: "20px",
                                                width: "calc(100% - 25px)",
                                            }}
                                            key={index}
                                        />
                                    </React.Fragment>
                                );
                            }
                            case controlType.BOOLEAN: {
                                // Hacky fix for auto exposure: FIXME: Change in backend
                                let VALUE_TRUE = 1;
                                let VALUE_FALSE = 0;
                                if (control.name.includes("Auto Exposure")) {
                                    VALUE_TRUE = 3;
                                    VALUE_FALSE = 1;
                                }
                                let { name, control_id } = control;
                                let { default_value } = control.flags;
                                const value =
                                    control.value === VALUE_TRUE ? true : false;
                                if (name.includes("White Balance")) {
                                    name = "AI TrueColor Technology™";
                                }
                                const [controlValue, setControlValue] =
                                    useState<boolean>(value as boolean);

                                setStatesList.push({
                                    control_id,
                                    name,
                                    setControlValue,
                                    default_value,
                                    type: control.flags.control_type,
                                });

                                useDidMountEffect(() => {
                                    device.controls.find(
                                        (control) =>
                                            control.control_id == control_id
                                    ).value = controlValue ? 1 : 0;
                                    setUVCControl(
                                        bus_info,
                                        controlValue ? VALUE_TRUE : VALUE_FALSE,
                                        control_id
                                    );
                                }, [controlValue]);

                                return (
                                    <React.Fragment key={index}>
                                        <span key={"label" + control_id}>
                                            {name}
                                        </span>
                                        <Switch
                                            checked={controlValue}
                                            onChange={(_, checked) => {
                                                setControlValue(!controlValue);
                                            }}
                                            name={`control-${control_id}`}
                                            key={index}
                                        />
                                    </React.Fragment>
                                );
                            }
                            case controlType.MENU: {
                                const { name, control_id } = control;
                                const { menu, default_value } = control.flags;
                                if (!menu) break;

                                const [controlValue, setControlValue] =
                                    useState<number>(control.value!);

                                if (control.value) {
                                    setStatesList.push({
                                        control_id,
                                        name,
                                        setControlValue,
                                        default_value,
                                        type: control.flags.control_type,
                                    });
                                }

                                useDidMountEffect(() => {
                                    device.controls.find(
                                        (control) =>
                                            control.control_id == control_id
                                    ).value = controlValue;
                                    setUVCControl(
                                        bus_info,
                                        controlValue,
                                        control_id
                                    );
                                }, [controlValue]);

                                return (
                                    <PopupState
                                        variant='popover'
                                        key={index}
                                        popupId={"" + control_id}
                                    >
                                        {(popupState) => (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                                key={index}
                                            >
                                                <span
                                                    key={"label" + index}
                                                    style={{
                                                        marginRight: "8px",
                                                    }}
                                                >
                                                    {name}:
                                                </span>
                                                <TextField
                                                    variant='standard'
                                                    key={index}
                                                    select
                                                    value={controlValue}
                                                    onChange={(e) => {
                                                        setControlValue(
                                                            parseInt(
                                                                e.target.value
                                                            )
                                                        );
                                                        popupState.close();
                                                    }}
                                                    {...bindTrigger(popupState)}
                                                    InputProps={{
                                                        disableUnderline: true,
                                                    }}
                                                >
                                                    {menu.map((menuItem) => (
                                                        <MenuItem
                                                            key={
                                                                "Menu" +
                                                                menuItem.index
                                                            }
                                                            value={
                                                                menuItem.index
                                                            }
                                                        >
                                                            {menuItem.name}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </div>
                                        )}
                                    </PopupState>
                                );
                            }
                        }
                    })}
                </FormGroup>
                <LineBreak />
                <Button
                    sx={{ width: "100%" }}
                    variant='outlined'
                    onClick={() => {
                        for (const control of setStatesList) {
                            switch (control.type) {
                                case controlType.INTEGER:
                                    (
                                        control.setControlValue as (
                                            value: number
                                        ) => void
                                    )(control.default_value as number);
                                    break;
                                case controlType.BOOLEAN:
                                    (
                                        control.setControlValue as (
                                            value: boolean
                                        ) => void
                                    )(control.default_value as boolean);
                                    break;
                                case controlType.MENU:
                                    (
                                        control.setControlValue as (
                                            value: string
                                        ) => void
                                    )(control.default_value as string);
                                    break;
                            }
                        }
                    }}
                >
                    Reset Controls
                </Button>
            </AccordionDetails>
        </Accordion>
    );
};
