import Switch from "@mui/material/Switch";
import { subscribe } from "valtio";
import { useState } from "react";
import ControlProps from "./props";
import React from "react";

const numberToBoolean = (val: number, VALUE_TRUE: number) => {
    return val === VALUE_TRUE ? true : false;
};

const BooleanControl: React.FC<ControlProps> = ({ control, index }) => {
    let VALUE_TRUE = 1;
    let VALUE_FALSE = 0;
    // Convert menu to boolean
    if (control.name.includes("Auto Exposure")) {
        VALUE_TRUE = 3;
        VALUE_FALSE = 1;
    }
    const [controlValue, setControlValue] = useState(
        numberToBoolean(control.value, VALUE_TRUE)
    );
    let { name, control_id } = control;

    if (name.includes("White Balance")) {
        name = "AI TrueColor Technology™";
    }

    subscribe(control, () => {
        setControlValue(numberToBoolean(control.value, VALUE_TRUE));
    });

    const toggleControlValue = () => {
        if (control.value === VALUE_TRUE) control.value = VALUE_FALSE;
        else control.value = VALUE_TRUE;
    };

    return (
        <React.Fragment key={index}>
            <span key={"label" + control_id}>{name}</span>
            <Switch
                checked={controlValue}
                onChange={() => toggleControlValue()}
                name={`control-${control_id}`}
                key={index}
            />
        </React.Fragment>
    );
};

export default BooleanControl;
