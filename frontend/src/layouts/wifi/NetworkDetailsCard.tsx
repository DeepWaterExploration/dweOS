import { Card, CardHeader, Typography } from "@mui/material";
import { WifiStatus } from "./types";

export interface NetworkDetailsCardProps {
    currentNetwork: WifiStatus;
}

const NetworkDetailsCard: React.FC<NetworkDetailsCardProps> = (props) => {
    return (
        <Card
            sx={{
                minWidth: 512,
                boxShadow: 3,
                textAlign: "left",
                margin: "20px",
                padding: "15px",
            }}
        >
            <CardHeader
                title={"Network Details"}
                sx={{ paddingBottom: "0px" }}
            />

            <Typography
                fontWeight='500'
                style={{
                    width: "100%",
                    textAlign: "left",
                    marginLeft: "25px",
                    marginTop: "10px",
                }}
            >
                IP Address - {props.currentNetwork.ip_address}
            </Typography>
        </Card>
    );
};

export default NetworkDetailsCard;
