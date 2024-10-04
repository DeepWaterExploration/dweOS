import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import AccordionDetails from "@mui/material/AccordionDetails";
import FormGroup from "@mui/material/FormGroup";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import React, { useContext } from "react";
import { Control, controlType, Device } from "../../types";
import { LineBreak } from "../../../../components/LineBreak";
import DeviceContext from "../../../../contexts/DeviceContext";
import { setUVCControl } from "../../api";
import { subscribe } from "valtio";
import IntegerControl from "./IntegerControl";
import BooleanControl from "./BooleanControl";
import MenuControl from "./MenuControl";

export const CameraControls: React.FC = () => {
    const { device } = useContext(DeviceContext) as { device: Device };

    const controls = device.controls;
    const bus_info = device.bus_info;

    const renderControl = (control: Control, index: number) => {
        // Convert auto exposure to a menu type
        if (
            control.name.includes("Auto Exposure") &&
            control.flags.control_type === controlType.MENU
        ) {
            control.flags.control_type = controlType.BOOLEAN;
        }

        subscribe(control, () => {
            setUVCControl(bus_info, control.value, control.control_id);
        });

        switch (control.flags.control_type) {
            case controlType.INTEGER:
                return (
                    <IntegerControl
                        key={index}
                        control={control}
                        index={index}
                    />
                );
            case controlType.BOOLEAN:
                return (
                    <BooleanControl
                        key={index}
                        control={control}
                        index={index}
                    />
                );
            case controlType.MENU:
                return (
                    <MenuControl key={index} control={control} index={index} />
                );
            default:
                return undefined;
        }
    };

    const resetControls = () => {
        for (let control of controls) {
            control.value = control.flags.default_value;
            setUVCControl(bus_info, control.value, control.control_id);
        }
    };

    return (
        <Accordion
            style={{
                width: "100%",
                marginTop: "20px",
                visibility: "visible",
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
                    {controls.map(renderControl)}
                </FormGroup>
                <LineBreak />
                <Button
                    sx={{ width: "100%" }}
                    variant='outlined'
                    onClick={resetControls}
                >
                    Reset Controls
                </Button>
            </AccordionDetails>
        </Accordion>
    );
};
