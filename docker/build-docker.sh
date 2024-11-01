sudo docker buildx create --use
sudo docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t dwe_os_2 --load -f docker/Dockerfile .

sudo docker run -d \
    -v /var/run/dbus/system_bus_socket:/var/run/dbus/system_bus_socket \
    -v /sys/class/video4linux:/sys/class/video4linux \
    -v /dev:/dev \
    --privileged \
    -p 5000:5000 -p 8080:8080 -p 9002:9002 -p 7681:7681 \
    --name DWE_OS_2 \
    dwe_os_2
