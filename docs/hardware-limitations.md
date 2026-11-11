# Hardware Limitations

Known limits of dweOS on specific hardware, based on testing. Add new hardware or
camera setups here as they are tested.

## Raspberry Pi 4

Rated for a maximum of **5 cameras**.

| Cameras | Behavior       |
| ------- | -------------- |
| 5       | Supported      |
| 6       | Slightly buggy |
| 7       | Unusable       |

Lowering the bitrate does not change this behavior (tested down to 7 Mbps).
