# Project Spelunky

A fork of dweOS (branch `project-spelunky`) for unattended recording on an NVIDIA
Jetson with stellarHD cameras.

## Decisions

- **Cameras:** stellarHD only. Each camera records independently (no leader/follower).
- **Format:** MJPG in AVI.
- **Schedule:** each recording stream starts a recording **every X seconds** that
  lasts **Y seconds**. Set per stream.
  - Y: 1–3600 s, default 60 s.
  - X: Y–86400 s, default 600 s. *(Placeholder until final values are known.)*
  - When X = Y, recordings run back to back, with a short gap each time the
    pipeline restarts.
- **Filenames:** use `bus_info` (there is no camera serial).
- **Lights:** on the sensor STROBE pin. At full brightness, with auto exposure on,
  during recordings. **Off between recordings.**
- **Storage:** the existing recordings directory (`RecordingsService.recordings_path`),
  so recordings show in the Recordings view.
- **Disk full:** stop recording by default, with an option to delete the oldest
  recordings. Set on the Settings page.

## Changes

### Recording
- Add X (interval) and Y (duration) to the stream models (`Stream`, `StreamModel`,
  `StreamInfoModel`, `SavedStreamModel`), and show them in `stream.tsx` when the
  stream type is Recording.
- Add a scheduler for each device that calls `start_stream()` / `stop_stream()`
  on the X/Y timing. Start times should follow a fixed X-second grid, so that
  pipeline start-up time doesn't make them drift.
- In `GStreamerPipelineBuilder`, use `avimux bigfile=true` (needed for files over
  1 GB), and name files `<bus_info>_<YYYYMMDDTHHMMSS>.avi` with no colons.
- Remove follower linking (`SettingsManager.link_followers`, `SHDDevice.start_stream`),
  so that a saved follower never switches a camera to `SynchronizedStreamEngine`,
  which can't record.

### Lights
- Remove the code that sets strobe width to 0:
  - `set_pu(-4, 0)` in `reapply_sensor_config` ([shd.py:276](backend_py/src/services/cameras/drivers/shd/shd.py:276)).
    This runs on every stream start, so without this change the lights would
    turn off at the start of every scheduled recording.
  - `set_pu(-4, 0)` in `on_external_unmanaged` ([shd.py:118](backend_py/src/services/cameras/drivers/shd/shd.py:118)).
  - `load_from_save = False` on `StrobeWidthOption` ([options.py:298](backend_py/src/services/cameras/drivers/shd/options.py:298)).
- Raise the `StrobeWidthOption` max from 4095 to 65535, and set the width to at
  least the frame length (VTS). See the strobe notes.
- Between recordings: the strobe should go low on its own once the sensor stops
  streaming.

### Storage
- Add a "Recording Storage" card to the Settings page (`preferences.tsx`), saved in
  `SavedPreferencesModel`: policy (stop / delete oldest) and free-space threshold
  (default 1 GB). "Delete oldest" works only in the recordings directory, and never
  deletes the file being recorded.
- Reduce the log rotation limit (currently about 1 GB, [server.py:92](backend_py/src/server.py:92)).
- At startup, repair unfinalized AVIs in the recordings directory with
  `ffmpeg -i in.avi -c copy out.avi`. Until an interrupted file is repaired, the
  Recordings view shows its duration as 00:00:00.

## Notes

### AVI after a crash
I killed an `avimux` recording with `kill -9`. The header and index were missing
(duration showed 0), but **all frames decoded**. `ffmpeg -c copy` fully repaired
the file, so no custom muxer is needed. A real power cut can also lose data that
hasn't been written to disk yet: up to about 30 s with default Linux settings.
Lowering `vm.dirty_expire_centisecs` on the Jetson image reduces that loss, if
it matters.

### Strobe and auto exposure (OG02B10 datasheet §3.8)
- The strobe pulse starts at a programmed row (0x3929/0x392A = VTS − exposure − 7)
  and lasts a set number of rows (0x3927/0x3928 hold the low 16 bits; 0x3925/0x3926
  hold the high 16 bits and stay 0). The datasheet says both must be written again
  whenever exposure changes. Auto exposure changes exposure without updating them,
  which is why strobe and auto exposure don't work together today.
- If the width is at least VTS, the pulse covers the whole frame, so the light is
  effectively continuous and not strobed. Any exposure auto exposure picks is fully
  lit. VTS is 16 bits, so 0x3927/0x3928 are enough. 4095 can be shorter than a
  frame at lower frame rates.

### Bench checks
- Scope the STROBE pin with width ≥ VTS. Confirm it stays high with no glitch at
  frame boundaries.
- Read 0x3920 (`strobe_pattern`). It defaults to 0xA5, which may fire the strobe on
  only some frames. It should be 0xFF.
- Confirm the strobe goes low when the stream stops. If it doesn't, use the
  fallback under Lights.
