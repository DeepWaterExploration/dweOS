# Linux Kernel UVC Driver Issues with Multiple Cameras

This project addresses challenges encountered when using multiple USB 2.0 cameras with Linux-based systems, particularly focusing on the UVC (USB Video Class) driver in the Linux kernel.

## Problem Overview

The primary issue arises when attempting to capture video in compressed formats from multiple USB 2.0 cameras. Despite USB 2.0's theoretical maximum bandwidth of 480 MB/s, problems occur even when the actual bandwidth usage is significantly lower.

### Key Points:

- Issues persist even with cameras using built-in H.264 compression and low bitrates.
- System crashes occur non-deterministically, often before reaching bandwidth saturation.
- The problem is influenced by the XHCI host controller and its bandwidth reporting to the UVC driver.

## Observed Behavior

In our testing, using multiple cameras set to 10 Mbps bitrate led to system crashes before reaching the theoretical bandwidth limit. The exact point of failure varies and depends on the specific hardware configuration.

## Potential Solutions

### 1. VL805 XHCI Host Controller

- Extensively optimized by Raspberry Pi for improved performance with multiple USB cameras.
- Available as HATs for embedded computers and add-in cards for desktop x86 machines.
- Generally offers more consistent performance.

### 2. Kernel Patch

- Modifies the reported bandwidth from the camera to be lower (within the UVC driver).
- Can potentially alleviate issues in some configurations.
- Can result in significantly more dropped frames

## Contributing

We welcome contributions to help resolve this issue. Please submit an issue.
