# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]` as you make it. The Release
workflow moves that section under the version it ships, and the section becomes
the notes of the version's GitHub Release.

## [Unreleased]

## [1.0.0] - 2026-11-19

### Added

- UBA stations, the official German air quality networks, read through the
  open UBA air data API v4 (no account): one device per station with the
  German air quality index (0 to 4), its level as a word, the pollutants of the
  index the station measures (PM2.5, PM10, NO₂, O₃, SO₂) and the age of the
  data.
- "Find a station" button: the active stations by name, city or code, or the
  nearest to a Gladys house, with their number and distance.
- "Check the stations" button: what each configured station answers now.
- "UBA air quality" dashboard widget, scene triggers "air quality degraded",
  "back to normal" and "pollutant level degraded", scene action "get the air
  quality".
- Texts and documentation in English, French, German and Spanish.

[Unreleased]: https://github.com/guim31/gladys-uba-air/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/guim31/gladys-uba-air/releases/tag/v1.0.0
