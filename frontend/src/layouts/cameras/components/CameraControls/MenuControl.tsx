import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import { subscribe } from "valtio";
import React, { useState } from "react";
import ControlProps from "./props";

const MenuControl: React.FC<ControlProps> = ({ control, index }) => {
    const { name, control_id } = control;
    const { menu } = control.flags;
    if (!menu) return undefined;

    const [controlValue, setControlValue] = useState(control.value);

    subscribe(control, () => {
        setControlValue(control.value);
    });

    return (
        <PopupState variant='popover' key={index} popupId={"" + control_id}>
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
                            control.value = parseInt(e.target.value);
                            popupState.close();
                        }}
                        {...bindTrigger(popupState)}
                        InputProps={{
                            disableUnderline: true,
                        }}
                    >
                        {menu.map((menuItem) => (
                            <MenuItem
                                key={"Menu" + menuItem.index}
                                value={menuItem.index}
                            >
                                {menuItem.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </div>
            )}
        </PopupState>
    );
};

export default MenuControl;
