# Changelog

## [0.8.0] - 2026-10-28

### Features

- *(cameras)* Pick the next free port when adding a stream endpoint (#566)
- *(cameras)* Update external management API to include process ID
- *(logs)* Export logs, click to copy, and a clearer log table (#567)
- *(pwm)* Disable serial pwm board access if rtpsender is enabled on device (#574)
- *(api)* Report the dweOS version in the API (#581)
- *(cameras)* Add split recording functionality via gstreamer
- *(frontend)* Change recordings view to sort creation date by default
- *(recordings)* Add duration to active recordings
- *(cameras)* Switch recording to use bus id for filenames
- *(cameras)* Add disk usage limit for recordings
- *(pwm)* Add PWM light mode for spelunking
- *(cameras)* Switch to mkv instead of mp4 and avi for recordings
- *(recordings)* Add recording duration caching
- *(recordings)* Add support for viewing mkv files in frontend
- *(recordings)* Make split recording configurable from preferences

### Bug Fixes

- *(recordings)* Stop deleting the last recording from returning a 404 (#555)
- *(cameras)* Resolve issue with asic interface thread lifetimes (#570)
- *(cameras)* Disable asic_interface for externally managed stellarHD devices (#576)
- *(ui)* Stop port fields from turning into NaN when cleared (#580)
- *(cameras)* Fix bug with exploreHD streams not starting at boot
- *(recordings)* Remove error message from exiftool
- *(recordings)* Fix exif duration bug with format interpretation

### Styling

- Remove unused

### Miscellaneous Tasks

- Add blueOS plugin version in readme (#559)
- *(release)* Publish labelled pull requests as preview prereleases
- *(backend)* Fix CI failure from ruff tool target version
- *(image)* Build the static IP Raspberry Pi image for releases (#564)

## [0.7.7] - 2026-10-01

### Features

- *(overview)* Show CHANGELOG.md on the overview page
- *(overview)* Collapse previous releases in the changelog

### Miscellaneous Tasks

- *(release)* Automate release branch, changelog, and tagging
- *(release)* Accept only plain vX.Y.Z release versions
- *(release)* Regenerate the changelog from the v0.7.3 baseline
- *(release)* Make bump_version.sh executable

## [0.7.6] - 2026-09-30

### Features

- *(recordings)* Record synchronized streams to DWVO

### Bug Fixes

- *(recordings)* Keep sizes of active recordings up to date
- *(cameras)* Allow string3 to be null in order to respect possible read outputs in asic_interface

## [0.7.5] - 2026-09-25

### Bug Fixes

- *(docker)* Move BlueOS image base to bookworm
- *(network)* Respect --no-wifi when setting up network management

### Miscellaneous Tasks

- *(blueos)* Add test_tag input for manual test builds

## [0.7.4] - 2026-09-02

### Features

- *(cameras)* [**breaking**] Disable camera controls on external management

### Styling

- *(backend)* Fix styling to match requirements of CI pipeline
- *(network)* Fix code style to reflect ty version 0.0.77

### Miscellaneous Tasks

- Add git-cliff for changelog management
