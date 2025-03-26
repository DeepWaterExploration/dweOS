import React, { useEffect, useRef, useState } from "react";

import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { isValidIP } from "../../../utils/utils";

interface EditableTextProps {
    isEditing: boolean;
    onClick?: () => void;
    onMouseOver?: () => void;
    onMouseOut?: () => void;
    name: string;
    text: string;
    setText: (s: string) => void;
    isSecondary: boolean;
    errorFunc?: (s: string) => boolean;
    minTextWidth: number;
    maxTextWidth: number;
    textWidthMultiplier: number;
}

const EditableText: React.FC<EditableTextProps> = ({
    isEditing,
    onClick,
    onMouseOver,
    onMouseOut,
    name,
    text,
    setText,
    isSecondary,
    errorFunc,
    minTextWidth,
    maxTextWidth,
    textWidthMultiplier,
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const [inputValue, setInputValue] = useState(text);
    const [inputWidth, setInputWidth] = useState<number>(undefined);
    const measureRef = useRef<HTMLSpanElement>(null);

    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (measureRef.current) {
            // Measure the text width and set input width
            const width = measureRef.current.offsetWidth;
            setInputWidth(
                Math.min(Math.max(width, minTextWidth), maxTextWidth) *
                    textWidthMultiplier
            );
        }

        setInputValue(text);
    }, [text]);

    useEffect(() => {
        setIsError(errorFunc ? errorFunc(inputValue) : false);
    }, [inputValue]);

    const updateString = (newAddress: string) => {
        if (!errorFunc(newAddress)) {
            setText(newAddress);
        } else {
        }
        setIsFocused(false);
    };

    const clampText = (text: string, maxLen: number) => {
        return text.length > maxLen ? text.substring(0, maxLen) : text;
    };

    return (
        <>
            <Typography
                component='span'
                sx={{
                    cursor: "text",
                    userSelect: "none",
                    fontSize: "inherit",
                    alignItems: "center",
                    verticalAlign: "middle", // Aligns with surrounding text
                    display: "inline-block", // Keeps the text level
                    maxWidth: "300px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
                onMouseOver={onMouseOver}
                onMouseOut={() => {
                    if (!isFocused && !isError) onMouseOut();
                }}
            >
                {name}&nbsp;
                {isEditing ? (
                    <TextField
                        // autoFocus
                        variant='standard'
                        size='small'
                        defaultValue={inputValue}
                        onBlur={(e) => !isError && updateString(e.target.value)}
                        onChange={(e) =>
                            setInputValue(clampText(e.target.value, 20))
                        }
                        onFocus={() => {
                            setIsFocused(true);
                        }}
                        error={isError}
                        sx={{
                            fontSize: "inherit",
                            lineHeight: "inherit", // Matches text alignment
                            padding: 0,
                            margin: 0,
                            maxWidth: "300px",
                            width: inputWidth ? `${inputWidth}px` : "auto",
                            minWidth: 0,
                            display: "inline-block", // Keeps it inline
                            height: "1em",
                            "& .MuiInputBase-root": {
                                padding: 0,
                                margin: 0,
                                fontSize: "inherit",
                                lineHeight: "inherit",
                            },
                            "& .MuiInputBase-input": {
                                fontSize: "inherit",
                                padding: 0,
                                margin: 0,
                                lineHeight: "inherit",
                                ...(isSecondary
                                    ? {
                                          color: (theme) =>
                                              theme.palette.text.secondary,
                                      }
                                    : {}),
                            },
                        }}
                    />
                ) : (
                    inputValue
                )}
                {/* Hidden span for width measurement */}
                <span
                    ref={measureRef}
                    style={{
                        position: "absolute",
                        visibility: "hidden",
                        whiteSpace: "pre",
                        fontSize: "inherit",
                    }}
                >
                    {text}
                </span>
            </Typography>
        </>
    );
};

export default EditableText;
