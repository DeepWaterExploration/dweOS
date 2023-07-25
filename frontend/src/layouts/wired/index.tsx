import MemoryIcon from "@mui/icons-material/Memory";
import React, { useEffect, useState } from "react";

import SensorCard from "./SensorCard";
import { CPUInfo } from "../../types/types";
import { getCPUInfo } from "../../utils/api";

const Wired: React.FC = () => {
  const [cpuInfo, setCPUInfo] = useState<CPUInfo>();

  useEffect(() => {
    // Fetch CPU info immediately when the component mounts
    const fetchCPUInfo = async () => {
      setCPUInfo(await getCPUInfo());
    };
    fetchCPUInfo();

    // Fetch CPU info every 30 seconds using setInterval
    const interval = setInterval(async () => {
      setCPUInfo(await getCPUInfo());
    }, 1000);

    // Clean up the interval on component unmount to avoid memory leaks
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <SensorCard
        icon={MemoryIcon}
        cardTitle={"CPU Usage"}
        cardSubtitle={`${cpuInfo?.total_usage || "Unknown"}`}
        deviceName={cpuInfo?.processor_name || "Unknown"}
        deviceStats={cpuInfo ? cpuInfo.core_usage : []}
      />
    </div>
  );
};

export default Wired;
