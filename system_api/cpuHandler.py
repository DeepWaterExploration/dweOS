import cpuinfo
import psutil


def get_cpu_info():
    cpu_info = {
        "processor_name": cpuinfo.get_cpu_info()["brand_raw"],  # Processor Name
        "physical_cores": psutil.cpu_count(logical=False),  # Physical cores
        "total_cores": psutil.cpu_count(
            logical=True
        ),  # Total cores (physical + virtual)
        "core_usage": psutil.cpu_percent(percpu=True),  # CPU Usage Per Core
        "total_usage": psutil.cpu_percent(percpu=False),  # Total CPU Usage (all cores)
    }
    return cpu_info
