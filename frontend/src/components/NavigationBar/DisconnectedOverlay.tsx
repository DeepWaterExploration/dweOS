import React from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

interface DisconnectedOverlayProps {
    open: boolean;
    zIndex: number;
}

const DisconnectedOverlay: React.FC<DisconnectedOverlayProps> = ({
    open,
    zIndex,
}) => {
    return (
        <Backdrop open={open} sx={{ zIndex }}>
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
