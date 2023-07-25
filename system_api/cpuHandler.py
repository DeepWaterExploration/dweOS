import cpuinfo
import psutil


# def get_total_cpu_usage():
#     return psutil.cpu_percent()

# def get_indivivdual_cpu_usage():
#     return psutil.cpu_percent(percpu=True, interval=1)

# if __name__ == "__main__":
#     print("Processor Name:", cpuinfo.get_cpu_info()['brand_raw'])
#     print("CPU Usage:", get_total_cpu_usage())
#     cpu_usage_percent_per_core = get_indivivdual_cpu_usage()
#     for core, usage_percent in enumerate(cpu_usage_percent_per_core, 1):
#         print(f"CPU Core {core}: {usage_percent}%")


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
