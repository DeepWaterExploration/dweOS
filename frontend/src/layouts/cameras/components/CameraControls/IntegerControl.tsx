import Slider from "@mui/material/Slider";
import React, { useState } from "react";
import { Control } from "../../types";
import { subscribe } from "valtio";

interface ControlProps {
    control: Control;
    index: number;
}

const IntegerControl: React.FC<ControlProps> = ({ control, index }) => {
    const { name, control_id, value } = control;
    const { min_value, max_value, step } = control.flags;
    const [controlValueSlider, setControlValueSlider] = useState<number>(
        value as number
    );

    subscribe(control, () => {
        setControlValueSlider(control.value);
    });

    return (
        <React.Fragment key={index}>
            <span key={"label" + index}>
                {name}: {controlValueSlider}
            </span>
            <Slider
                onChangeCommitted={(_, newValue) =>
                    (control.value = newValue as number)
                }
                onChange={(_, newValue) =>
                    setControlValueSlider(newValue as number)
                }
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
                key={"slider" + index}
            />
        </React.Fragment>
    );
};

export default IntegerControl;
