import subprocess, platform


def get_available_disks():
    current_os = platform.system()
    match current_os:
        case "Windows":
            cmd = "wmic diskdrive get caption"
        case "Linux":
            cmd = "df -B1 -t ext4 -t ext3 -t ext2 -t xfs -t btrfs"
        case "Darwin":
            cmd = "df -B1 -t ext4 -t ext3 -t ext2 -t xfs -t btrfs"
        case _:
            raise NotImplementedError("Unsupported platform")
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    disks = {
        "disks": [],
    }
    if current_os == "Windows":
        available_disks = result.stdout.split("\n")[1:-2]
    else:
        lines = result.stdout.strip().split("\n")[1:]
        for line in lines:
            path, size, used, available, percentage, mount_point = line.split()
            disks["disks"].append(
                {
                    "path": path,
                    "size": int(size),
                    "used": int(used),
                    "available": int(available),
                    "mount_point": mount_point,
                }
            )
    return disks


def get_disk_info():
    cmd = "lsblk -o NAME,SIZE,FSTYPE,FSSIZE,FSUSED,FSAVAIL -b -n -l"
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    lines = result.stdout.strip().split("\n")
    disk_info = {}
    for line in lines:
        items = line.split()
        if len(items) >= 2:  # Ensure there are enough values to unpack
            name, size = items[:2]
            fs_info = items[2:]
            freespace = 0
            if fs_info and fs_info[-1].isdigit():
                freespace = int(fs_info[-1])
            disk_info[name] = {
                "size": int(size),
                "freespace": freespace,
            }
    return disk_info


disk_info = get_disk_info()
for disk, info in disk_info.items():
    print(f"Disk: {disk}")
    print(f"Total Size: {info['size']} bytes")
    print(f"Free Space: {info['freespace']} bytes")
    print()
