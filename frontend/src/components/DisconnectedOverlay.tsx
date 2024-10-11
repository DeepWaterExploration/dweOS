import React from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

interface DisconnectedOverlayProps {
    open: boolean;
}

const DisconnectedOverlay: React.FC<DisconnectedOverlayProps> = ({ open }) => {
    return (
        <Backdrop open={open}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <CircularProgress
                    size={60}
                    thickness={4}
                    sx={{ color: "#fff" }}
                />
            </Box>
        </Backdrop>
    );
};

export default DisconnectedOverlay;
