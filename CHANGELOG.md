# Changelog

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
