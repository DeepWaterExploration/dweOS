# Base image
FROM python:3.10-slim-bullseye

# Install dependencies
RUN apt-get update -y && apt-get upgrade -y &&\
    apt-get install -y curl dbus wget sudo &&\
    apt-get clean

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

LABEL authors='[\
    {\
    "name": "Brandon Stevens",\
    "email": "support@dwe.ai"\
    }\
    ]'

LABEL company='{\
    "about": "",\
    "name": "DeepWater Exploration",\
    "email": "support@dwe.ai"\
    }'

LABEL permissions='{ \
    "ExposedPorts": { \
    "8000/tcp": {}, \
    }, \
    "HostConfig": { \
    "Privileged": true, \
    "Binds": [ \
    "/sys/class/video4linux:/sys/class/video4linux", \
    "dweos-settings:/settings", \
    "/dev:/dev" \
    ], \
    "PortBindings": { \
    "8000/tcp": [ \
    { "HostPort": "" } \
    ], \
    } \
    }'

LABEL type="device-integration"

LABEL tags='[\
    "cameras",\
    "dwe-ai",\
    "exporehd",\
    "stellarhd",\
    "deepwater-exploration"\
    ]'

LABEL links='{\
    "support": "https://dwe.ai/pages/contact"\
    }'

LABEL readme="https://raw.githubusercontent.com/DeepwaterExploration/DWE_OS_2/main/DESCRIPTION.md"

# Expose required ports
EXPOSE 8000

# Mount required host directories (for dbus, video4linux, and dev access)
VOLUME ["/sys/class/video4linux", "/dev", "/run/dbus", "/var/run/dbus"]

# Install DWE_OS_2
COPY release /opt/DWE_OS_2

WORKDIR /opt/DWE_OS_2

RUN mkdir /settings

# Run DWE_OS_2
CMD ["python3", "/opt/DWE_OS_2/run_release.py", "--no-ttyd", "--port", "8000", "--no-wifi", "--settings-path", "/settings"]
