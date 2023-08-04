/**
 * Represents the types of information about the CPU
 */
export interface CPUInfo {
  processor_name: string;
  physical_cores: number;
  total_cores: number;
  core_usage: number[];
  total_usage: number;
}

/**
 * Represents the types of information about the disk
 */

export interface DiskInfo {
  disk_usage: number;
}

/**
 * Represents the types of information about the memory
 */
export interface MemoryInfo {
  memory_usage: number;
}

/**
 * Represents the information available about the temperature
 */

export interface TemperatureInfo {
  processor_temp: number;
}
