import BrowserUpdatedSharpIcon from "@mui/icons-material/BrowserUpdatedSharp";
import {
    Avatar,
    Button,
    Card,
    CardContent,
    CardHeader,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Release } from "../../types/types";
import { getReleases, installUpdate } from "../../utils/api";

export interface VersionItemProps {
    isInstallable: boolean;
    isMostRecent: boolean;
    dateReleased: Date;
    version: string;
}

const VersionItem: React.FC<VersionItemProps> = (props) => {
    const currentDate = new Date();
    const daysSince = Math.floor(
        (currentDate.getTime() - props.dateReleased.getTime()) /
            (1000 * 3600 * 24)
    );

    return (
        <ListItem
            secondaryAction={
                props.isInstallable ? (
                    <Button
                        variant='contained'
                        onClick={() => {
                            installUpdate(props.version);
                        }}
                    >
                        Install
                    </Button>
                ) : undefined
            }
        >
            <ListItemAvatar>
                <Avatar>
                    <BrowserUpdatedSharpIcon />
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={`DWE OS ${props.version}`}
                secondary={
                    (props.isMostRecent ? "Most Recent - " : "") +
                    daysSince +
                    (daysSince !== 1 ? " days ago" : " day ago")
                }
            />
        </ListItem>
    );
};

const Updater: React.FC = () => {
    const [releases, setReleases] = useState<Release[]>([]);
    const [currentRelease, setCurrentRelease] = useState<Release>();

    useEffect(() => {
        getReleases().then((r) => {
            setReleases(r.releases.filter((release) => !release.current));
            setCurrentRelease(r.releases.find((release) => release.current));
        });
    }, []);

    return (
        <Grid
            container
            spacing={4}
            alignItems='baseline'
            flexWrap='wrap'
            style={{
                justifyContent: "left",
                padding: "0 3em",
            }}
        >
            <Card
                sx={{
                    minWidth: 512,
                    boxShadow: 3,
                    textAlign: "left",
                    margin: "20px",
                    padding: "15px",
                }}
            >
                <CardHeader title={"OS Updater"} />
                <CardContent sx={{ marginTop: "-20px" }}>
                    <Typography
                        sx={{ fontSize: "1rem" }}
                        color='text.secondary'
                    >
                        Current Version
                    </Typography>
                    {currentRelease ? (
                        <VersionItem
                            isInstallable={false}
                            isMostRecent={currentRelease.mostRecent}
                            version={currentRelease.tag_name}
                            dateReleased={new Date(currentRelease.published_at)}
                        />
                    ) : undefined}
                    <Typography
                        sx={{ fontSize: "1rem" }}
                        color='text.secondary'
                        marginTop={"5px"}
                    >
                        Available Versions
                    </Typography>
                    <Paper
                        style={{
                            maxHeight: 300,
                            overflow: "auto",
                            marginTop: "14px",
                        }}
                        elevation={4}
                    >
                        <List>
                            {releases?.map((release: Release) => {
                                return (
                                    <VersionItem
                                        isInstallable={true}
                                        isMostRecent={release.mostRecent}
                                        version={release.tag_name}
                                        dateReleased={
                                            new Date(release.published_at)
                                        }
                                    />
                                );
                            })}
                        </List>
                    </Paper>
                </CardContent>
            </Card>
        </Grid>
    );
};

export default Updater;
