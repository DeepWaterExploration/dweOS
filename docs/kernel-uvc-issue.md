# Issues with streaming multiple cameras

[Previous contents](https://github.com/DeepWaterExploration/dweOS/blob/v0.7.0/docs/kernel-uvc-issue.md)

If you are seeing this page, you've likely experienced an issue with dweOS when trying to stream more than 1 camera. If that's not the case and you've reached this page erroneously (likely another bug or crash wrongly interpreted as the kernel issue), please reach out or submit an [issue](https://github.com/DeepWaterExploration/dweOS/issues).

USB cameras, when used with Linux often have a nondeterministic issue related to bandwidth saturation. Depending on the USB chip and how it's connected to the CPU, we've witnessed a variety of different configurations allowing anywhere between 1-6 cameras to be connected without observing a system error. This is due to the specifics on how compressed video feeds report bandwidth on a microsecond basis instead of a second basis, causing rejection from the USB bus because it's expecting more data compared to what is actually sent.

## Solution

We have now tuned our firmware to account for this issue and report the bandwidth according to the real data rate, instead of the expected maximum (how most USB cameras report bandwidth).

Please update your firmware to the latest version using our firmware update guide: https://docs.dwe.ai/exploreHD/guides/exploreHD-firmware
