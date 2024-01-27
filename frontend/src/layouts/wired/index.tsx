import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";

import { getCPUInfo, getTemperatureInfo } from "./api";
import CPUCard from "./CPUCard";
import DiskCard from "./DiskCard";
import { DiskInfo, MemoryInfo } from "./types";
// import MemoryCard from "./MemoryCard";
import TemperatureCard from "./TemperatureCard";
import { CPUInfo, TemperatureInfo } from "./types";

const Wired: React.FC = () => {
    const [cpuInfo, setCPUInfo] = useState<CPUInfo | null>(null);
    const [diskInfo, setDiskInfo] = useState<DiskInfo | null>(null);
    const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
    const [temperatureInfo, setTemperatureInfo] =
        useState<TemperatureInfo | null>(null);
    const [minTemp, setMinTemp] = useState<number | null>(null);
    const [maxTemp, setMaxTemp] = useState<number | null>(null);

    useEffect(() => {
        // Track the maximum temperature using a local variable
        let localMaxTemp = maxTemp;
        let localMinTemp = minTemp;
        // Fetch CPU info immediately when the component mounts
        const fetchMachineInfo = async () => {
            const cpuInfo = await getCPUInfo();
            setCPUInfo(cpuInfo);
            // const diskInfo = await get
            // setDiskInfo(diskInfo);
            // const memoryInfo = await getCPUInfo();
            // setMemoryInfo(memoryInfo);
            const temperatureInfo = await getTemperatureInfo();
            setTemperatureInfo(temperatureInfo);
            // Update the localMaxTemp if the fetched temperature is greater than the current localMaxTemp
            if (
                localMinTemp === null ||
                temperatureInfo.processor_temp < localMinTemp
            ) {
                localMinTemp = temperatureInfo.processor_temp;
                console.log(localMinTemp);
            }
            if (
                localMaxTemp === null ||
                temperatureInfo.processor_temp > localMaxTemp
            ) {
                localMaxTemp = temperatureInfo.processor_temp;
                console.log(localMaxTemp);
            }

            // Update the state with the new temperatureInfo and the final localMaxTemp
            setTemperatureInfo(temperatureInfo);
            setMinTemp(localMinTemp);
            setMaxTemp(localMaxTemp);
        };
        fetchMachineInfo();

        // Fetch CPU info every 30 seconds using setInterval
        const interval = setInterval(async () => {
            fetchMachineInfo();
        }, 1000);

        // Clean up the interval on component unmount to avoid memory leaks
        return () => {
            clearInterval(interval);
        };
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
            {cpuInfo !== null &&
                temperatureInfo !== null &&
                maxTemp !== null && (
                    <>
                        <CPUCard
                            totalUsagePercent={cpuInfo.total_usage}
                            deviceName={cpuInfo.processor_name || "Unknown"}
                            deviceStats={cpuInfo ? cpuInfo.core_usage : []}
                        />
                        {/* <DiskCard
            currentDiskUsagePercent={diskInfo.disk_usage}
           /> */}
                        {/* <MemoryCard
            totalMemory={memoryInfo.total_memory}
            memoryUsagePercent={memoryInfo.memory_usage}
            />

           */}
                        <TemperatureCard
                            cpuTemp={temperatureInfo.processor_temp}
                            minTemp={minTemp || 0}
                            maxTemp={maxTemp}
                        />
                    </>
                )}
        </Grid>
    );
};

export default Wired;
