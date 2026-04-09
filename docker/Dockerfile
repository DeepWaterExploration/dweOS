# Base image
FROM python:3.10-slim-bullseye

# Install dependencies
RUN apt-get update -y && apt-get install -y --no-install-recommends \
  curl dbus wget sudo build-essential gcc \
  libdbus-1-dev libglib2.0-dev python3-dev pkg-config dbus-x11 \
  libdbus-glib-1-dev libgstreamer1.0-dev \
  libgstreamer-plugins-base1.0-dev gstreamer1.0-tools \
  gstreamer1.0-x gstreamer1.0-plugins-base gstreamer1.0-plugins-good \
  gstreamer1.0-plugins-bad gstreamer1.0-libav gstreamer1.0-plugins-ugly \
  libimage-exiftool-perl \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

ARG TARGETARCH
RUN if [ "$TARGETARCH" = "amd64" ]; then ARCH="x86_64"; \
  elif [ "$TARGETARCH" = "arm64" ]; then ARCH="aarch64"; \
  elif [ "$TARGETARCH" = "arm" ]; then ARCH="armhf"; \
  else ARCH="x86_64"; fi && \
  curl -f -L -o /usr/local/bin/ttyd "https://github.com/tsl0922/ttyd/releases/download/1.6.3/ttyd.${ARCH}" && \
  chmod +x /usr/local/bin/ttyd

# Copy requirements.txt with cache
COPY release/backend_py/requirements.txt .

RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
  pip install --no-build-isolation gevent==22.10.2 && \
  pip install --no-cache-dir -r requirements.txt

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
  "8000/tcp": {} \
  }, \
  "HostConfig": { \
  "Privileged": true, \
  "Binds": ["/sys/class/video4linux:/sys/class/video4linux", "/usr/blueos/userdata/dwe_os_2:/settings", "/dev:/dev"], \
  "PortBindings": { \
  "8000/tcp": [ \
  { \
  "HostPort": "" \
  } \
  ] \
  } \
  } \
  } \
  '

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
