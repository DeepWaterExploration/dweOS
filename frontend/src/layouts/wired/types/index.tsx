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
