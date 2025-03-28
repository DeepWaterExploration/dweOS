import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { Control } from "../../types";
import { subscribe } from "valtio";
import EditableText from "../EditableText";

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

    console.log(min_value);
    const [isEditing, setIsEditing] = useState(false);

    subscribe(control, () => {
        setControlValueSlider(control.value);
    });

    function isFloat(str: string): boolean {
        return !isNaN(parseFloat(str)) && isFinite(Number(str));
    }

    return (
        <React.Fragment key={index}>
            <span key={"label" + index}>
                <Typography>
                    <EditableText
                        name={`${name}:`}
                        text={`${controlValueSlider}`}
                        isEditing={isEditing}
                        setText={(v) => {
                            setControlValueSlider(parseFloat(v));
                            control.value = parseFloat(v);
                            setIsEditing(false);
                        }}
                        onMouseOver={() => setIsEditing(true)}
                        onMouseOut={() => setIsEditing(false)}
                        isSecondary={false}
                        minTextWidth={20}
                        maxTextWidth={300}
                        textWidthOffset={5}
                        errorFunc={(s) =>
                            !(
                                isFloat(s) &&
                                parseFloat(s) <= max_value &&
                                parseFloat(s) >= min_value
                            )
                        }
                    />
                </Typography>
            </span>
            <Slider
                onChangeCommitted={(_, newValue) =>
                    (control.value = newValue as number)
                }
                onChange={(_, newValue) => {
                    setControlValueSlider(newValue as number);
                    setIsEditing(false);
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
                key={"slider" + index}
            />
        </React.Fragment>
    );
};

export default IntegerControl;
