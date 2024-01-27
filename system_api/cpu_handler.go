package main

import (
	"time"

	"github.com/shirou/gopsutil/cpu"
)

func GetCPUInfo() (map[string]interface{}, error) {
	cpuInfo := make(map[string]interface{})

	// Get CPU Info
	cpuInfoStat, err := cpu.Info()
	if err != nil {
		return nil, err
	}
	cpuInfo["processor_name"] = cpuInfoStat[0].ModelName

	// Get Physical Cores
	physicalCores, err := cpu.Counts(true)
	if err != nil {
		return nil, err
	}
	cpuInfo["physical_cores"] = physicalCores

	// Get Total Cores
	totalCores, err := cpu.Counts(false)
	if err != nil {
		return nil, err
	}
	cpuInfo["total_cores"] = totalCores

	// Get CPU Usage Per Core
	coreUsage, err := cpu.Percent(time.Duration(0), true)
	if err != nil {
		return nil, err
	}
	cpuInfo["core_usage"] = coreUsage

	// Get Total CPU Usage (all cores)
	totalUsage, err := cpu.Percent(time.Duration(0), false)
	if err != nil {
		return nil, err
	}
	cpuInfo["total_usage"] = totalUsage

	return cpuInfo, nil
}
