import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";

import React, { useContext } from "react";

import { LineBreak } from "../../../components/LineBreak";
import { styles } from "../../../style";
import { LightDevice } from "../types";
import LightContext from "../../../contexts/LightContext";
import CloseIcon from "@mui/icons-material/Close";

const LightCard: React.FC = () => {
    const { light } = useContext(LightContext) as { light: LightDevice };

    return (
        <Card sx={{ ...styles.card, maxWidth: 400, position: "relative" }}>
            <CardHeader
                title={"Light"}
                subheader={
                    <>
                        <span>{light.controller_name}</span>
                        <LineBreak />
                        <span>Pin: {light.pin}</span>
                        <LineBreak />
                        <TextField
                            fullWidth
                            sx={{}}
                            onChange={(e) => {
                                light.nickname = e.target.value;
                            }}
                            helperText='Device Nickname'
                            placeholder='Device Nickname'
                            variant='standard'
                            defaultValue={light.nickname || ""}
                        />
                    </>
                }
            />
            <CardContent>
                <div style={{ paddingBottom: 20, width: "100%" }}>
                    <div style={{ marginTop: 10 }}>
                        <span
                            style={{
                                marginRight: "8px",
                            }}
                        >
                            Intensity:
                        </span>
                        <Slider
                            onChangeCommitted={(_, value) =>
                                (light.intensity = value as number)
                            }
                            style={{
                                marginLeft: "20px",
                                width: "calc(100% - 25px)",
                            }}
                            defaultValue={light.intensity}
                            min={0}
                            max={100}
                            step={0.1}
                        />
                    </div>
                </div>
                <IconButton
                    sx={{
                        position: "absolute",
                        top: 5,
                        right: 15,
                    }}
                    edge='end'
                    aria-label='icon'
                >
                    <CloseIcon />
                </IconButton>
            </CardContent>
        </Card>
    );
};

export default LightCard;
