import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";

import { getCPUInfo } from "./api";
import CPUCard from "./CPUCard";
import DiskCard from "./DiskCard";
// import MemoryCard from "./MemoryCard";
// import TemperatureCard from "./TemperatureCard";
import { CPUInfo } from "./types";

const Wired: React.FC = () => {
  const [cpuInfo, setCPUInfo] = useState<CPUInfo | null>(null);
  const [diskInfo, setDiskInfo] = useState<DiskInfo | null>(null);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [temperatureInfo, setTemperatureInfo] = useState<TemperatureInfo | null>(
    null
  );

  useEffect(() => {
    // Fetch CPU info immediately when the component mounts
    const fetchMachineInfo = async () => {
      const cpuInfo = await getCPUInfo();
      setCPUInfo(cpuInfo);
      // const diskInfo = await get
      // setDiskInfo(diskInfo);
      // const memoryInfo = await getCPUInfo();
      // setMemoryInfo(memoryInfo);
      // const temperatureInfo = await getCPUInfo();
      // setTemperatureInfo(temperatureInfo);
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
      {cpuInfo !== null && (
        <>
          <CPUCard
            totalUsagePercent={cpuInfo.total_usage}
            deviceName={cpuInfo.processor_name || "Unknown"}
            deviceStats={cpuInfo ? cpuInfo.core_usage : []}
          />
          {/* <DiskCard
            currentDiskUsagePercent={diskInfo.disk_usage}
           /> */}
        </>
      )}
    </Grid>
  );
};

export default Wired;
