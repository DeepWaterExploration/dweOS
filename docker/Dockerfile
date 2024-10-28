# Base image
FROM python:3.10-slim-bullseye

# Install dependencies
RUN apt-get update -y && apt-get upgrade -y \
    && apt-get install -y curl dbus wget sudo \
    && apt-get clean

RUN apt-get install -y \
    build-essential \
    gcc \
    libdbus-1-dev \
    libglib2.0-dev \
    python3-dev \
    pkg-config \
    dbus \
    dbus-x11

# Copy requirements.txt with cache
COPY release/backend_py/requirements.txt .

# Copy apt requirements with cache
COPY release/install_requirements.sh .

RUN pip install --no-cache-dir -r requirements.txt

RUN sh install_requirements.sh

# Install DWE_OS_2
COPY release /opt/DWE_OS_2

WORKDIR /opt/DWE_OS_2


# Expose required ports
EXPOSE 8000
EXPOSE 8080
EXPOSE 9002
EXPOSE 7681

# Mount required host directories (for dbus, video4linux, and dev access)
VOLUME ["/sys/class/video4linux", "/dev", "/run/dbus", "/var/run/dbus"]

# Set the environment to enable dbus
ENV DBUS_SYSTEM_BUS_ADDRESS=unix:path=/run/dbus/system_bus_socket

# Run DWE_OS_2
CMD ["python3", "/opt/DWE_OS_2/run_release.py", "--no-ttyd", "--port", "8000"]
