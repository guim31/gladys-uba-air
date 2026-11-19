# UBA Air Quality for Gladys Assistant

External integration for [Gladys Assistant](https://gladysassistant.com) that
brings the official air quality in Germany into Gladys: the stations of the
federal states' measuring networks, with the **air quality index**
(Luftqualitätsindex) of the
[Umweltbundesamt](https://www.umweltbundesamt.de/daten/luft/luftdaten/luftqualitaet)
(UBA, the German Environment Agency), station by station, hour by hour.

This integration is **not affiliated with the Umweltbundesamt**.

Looking for a model-based air quality anywhere in the world? See
[`prohand/gladys-airquality`](https://github.com/prohand/gladys-airquality)
(Copernicus CAMS). German civil protection warnings:
[`LM1LC3N7/gladys-nina`](https://github.com/LM1LC3N7/gladys-nina). Here: the
measurements of the official German stations.

## What it does

- **Stations** of the UBA network by their number, through the open UBA air
  data API v4 (`luftdaten.umweltbundesamt.de`): no account, no key. A **Find a
  station** button searches the active stations by name, city or code (accents
  optional), or lists the nearest ones to the location of a Gladys house, with
  their distance.
- **One device per station**: the German air quality index (0 very good to 4
  very poor) and its level as a word, the pollutants of the index the station
  measures (PM2.5, PM10, NO₂, O₃, SO₂, in µg/m³) and the age of the data.
  Values older than 3 hours are not published as current.
- A **UBA air quality** dashboard widget (index level colored, pollutant
  tiles, each block can be hidden), three scene triggers, **air quality
  degraded** (the index rises to "moderate" or worse, the levels picked as
  filters), **back to normal**, and **pollutant level degraded** (the
  sub-index of one pollutant, picked as a filter, rises), and a scene action
  **Get the air quality** (one station or the worst one, with a sentence ready
  for a notification).

Read only. Tested against the real API (Berlin Wedding, Potsdam-Zentrum,
München/Stachus, a closed station, an unknown id): the test fixtures are its
recorded answers.

The user documentation, in [English](docs/en.md), [French](docs/fr.md),
[German](docs/de.md) and [Spanish](docs/es.md), is re-hosted by Gladys behind
the **Documentation** link of the Configuration screen.

## Requirements

- Gladys Assistant **5.3.0** or later (the store shows the integration to
  users in Germany, a 5.3 field; the station search uses the house picker of
  5.2.0, the widget and the scene cards need 5.1).
- Internet access to `luftdaten.umweltbundesamt.de`.

## Installation

In Gladys, open **Integrations → Install from GitHub** and enter
`https://github.com/guim31/gladys-uba-air`. Then fill the Configuration tab:
see [the documentation](docs/en.md#configuration).

## Respect of the API

UBA publishes no request quota. The integration:

- reads a station every 30 minutes (or every hour), 10 stations at most, one
  after the other, **one request per station** (its last day of hours);
- reads the station list once a day at most, and keeps it under `/data`;
- reads only the stations whose device was added to Gladys (and, once, the
  ones it does not know yet, to list them in the Discovery tab);
- sends a `User-Agent` naming the integration and this repository.

It uses the API **v4**: the v3 (`www.umweltbundesamt.de/api/air_data/v3`) is
deprecated and stops on 1 February 2027.

## Limits

- Hourly data, sent by the states to UBA with a delay: the values lag by 1 to
  2 hours. The current year's data are not yet validated.
- Only the pollutants of the index (NO₂, O₃, PM10, PM2.5, SO₂), as UBA uses
  them: hourly averages for the gases, 24-hour averages updated every hour for
  the particles. CO, benzene and the heavy metals are left out.
- UBA dates are in CET all year round (no summer time): the integration
  converts them, whatever the time zone of Gladys.

## Development

```bash
npm install
npm run format:check   # Prettier
npm run lint           # ESLint
npm test               # node --test, against the SDK's fake Gladys
```

The tests never touch the network: they run on the answers of the UBA API
recorded on 19 November 2026 (`test/fixtures/uba`). The architecture and the
rules of the project are in [`CLAUDE.md`](CLAUDE.md).

## Credits

- The [Umweltbundesamt](https://www.umweltbundesamt.de) and the measuring
  networks of the federal states and the federal government, for the data,
  the air quality index and the open API. Data licence Germany – attribution –
  2.0 ([dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0)). Source:
  "Umweltbundesamt mit Daten der Messnetze der Länder und des Bundes".
- The logo on the cover is the Umweltbundesamt logo, from
  [luftdaten.umweltbundesamt.de](https://luftdaten.umweltbundesamt.de); it
  only names the data source.
- Built from the official
  [JavaScript template](https://github.com/GladysAssistant/integration-template-js)
  and SDK [`@gladysassistant/integration-sdk`](https://github.com/GladysAssistant/integration-sdk-js).

## License

[Apache-2.0](LICENSE)
