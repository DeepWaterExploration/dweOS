import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import React from "react";
import { PropsWithChildren } from "react";
import { styles } from "../../../style";

interface SettingsCardProps extends PropsWithChildren {
    cardTitle: string;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ cardTitle, children }) => {
    return (
        <Card raised sx={styles.settingsCard.card}>
            <CardContent sx={styles.cardContent}>
                <Typography
                    sx={styles.settingsCard.cardContent.cardTitle}
                    variant='h6'
                    color='textPrimary'
                >
                    {cardTitle}
                </Typography>
            </CardContent>
            <div style={styles.settingsCard.options}>{children}</div>
        </Card>
    );
};

export default SettingsCard;
