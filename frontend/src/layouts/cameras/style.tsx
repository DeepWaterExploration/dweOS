// import { palette } from "../../utils/themes";

export const styles = {
  card: {
    margin: "20px",
    height: "auto",
    width: "450px",
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
    // bgcolor: `${palette.main[1]} !important`,
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
