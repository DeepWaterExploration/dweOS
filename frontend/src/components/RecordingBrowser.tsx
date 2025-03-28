import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface VideoCardProps {
    title: string;
}

const VideoCardComponent: React.FC<VideoCardProps> = ({ title }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <video className="h-full w-full rounded-lg" controls>
                    <source
                        src="https://docs.material-tailwind.com/demo.mp4"
                        type="video/mp4"
                    />
                    Your browser does not support the video tag.
                </video>
            </CardContent>
        </Card>
    )
}

export function RecordingBrowser() {
    return (
        <Card>
            <CardContent className="my-5 ">
                <div className="grid grid-cols-2 gap-4">
                    <VideoCardComponent title="2024-08-16-8:45:22" />
                    <VideoCardComponent title="2024-08-17-9:23:01" />
                    <VideoCardComponent title="2024-08-18-6:56:05" />
                    <VideoCardComponent title="2024-08-19-13:12:00" />
                </div>
            </CardContent>
        </Card>
    )
}