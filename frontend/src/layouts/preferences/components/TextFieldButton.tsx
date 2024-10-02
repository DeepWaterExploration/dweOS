import { Button, InputBaseProps, TextField, Tooltip } from "@mui/material";
import React, { HTMLInputTypeAttribute } from "react";
import { styles } from "../../../style";

interface TextInput_ButtonProps {
    textInputLabel: string;
    textInputValue: string;
    buttonLabel: string;
    tooltip?: string;
    type?: HTMLInputTypeAttribute;
    textInputError?: boolean;
    buttonOnClick: () => void; // Function for Button's onClick event
    textFieldOnChange: (value: string) => void; // Function for TextField's onChange event
    children?: React.ReactNode; // Add children prop
    inputProps?: InputBaseProps["inputProps"];
}

const TextFieldButton: React.FC<TextInput_ButtonProps> = ({
    textInputLabel,
    textInputValue,
    buttonLabel,
    tooltip,
    type,
    textInputError,
    buttonOnClick,
    textFieldOnChange,
    children,
    inputProps,
}) => {
    const handleTextFieldChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        textFieldOnChange(event.target.value);
    };

    return (
        <div style={styles.settingsButton.textButtonContainer}>
            <Tooltip title={tooltip} placement='bottom-end'>
                <TextField
                    sx={styles.settingsButton.textInput}
                    label={textInputLabel}
                    onChange={handleTextFieldChange}
                    value={textInputValue}
                    variant='outlined'
                    error={textInputError}
                    size='small'
                    type={type}
                    inputProps={inputProps}
                />
            </Tooltip>
            <Button
                sx={styles.settingsButton.button}
                variant='contained'
                onClick={buttonOnClick}
            >
                {buttonLabel}
            </Button>
            {children}
        </div>
    );
};

export default TextFieldButton;
