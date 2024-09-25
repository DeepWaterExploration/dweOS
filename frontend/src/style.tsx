// import { palette } from "../../utils/themes";

export const styles = {
    card: {
        minWidth: 512,
        boxShadow: 3,
        textAlign: "left",
        margin: "20px",
    },
    addButton: {
        padding: 0,
        position: "fixed",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        bottom: "20px",
        right: "20px",
        margin: "50px 0px 0px 50px",
        height: "50px",
        width: "50px",
        "& .MuiSvgIcon-root": {
            color: "white",
        },
        transition: "box-shadow 0.25s ease, filter 0.25s ease",
        "&:hover": {
            filter: "brightness(80%)",
            boxShadow: "0px 0px 10px",
        },
    },
    cardMediaContainer: {
        position: "relative",
        paddingTop: "56.25%",
        overflow: "hidden",
    },
    cardMedia: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
    },
    recordingText: {
        position: "absolute",
        top: "10px",
        left: "10px",
        fontWeight: "bold",
        WebkitTextStroke: "1px black",
        WebkitTextFillColor: "white",
        visibility: "hidden",
    },
    closeButton: {
        position: "absolute",
        top: 0,
        right: 0,
    },
    cardContent: {
        marginBottom: "0px",
        div: {
            display: "flex",
            gap: "15px",
            marginTop: "20px",
            marginBottom: "20px",
        },
    },
    textField: {
        width: "250px",
    },
    portField: {
        width: "170px",
    },
    settingsButton: {
        width: "55px",
        height: "55px",
        color: "white",
        borderRadius: 2,
    },
    recordButton: {
        width: "55px",
        height: "55px",
        bgcolor: "#ff0010 !important",
        color: "white",
        borderRadius: 50,
    },
} as const;
