# UBA Air Quality

The official air quality in Germany: the stations of the federal states'
measuring networks, with the **air quality index** (Luftqualitätsindex) of the
[Umweltbundesamt](https://www.umweltbundesamt.de/daten/luft/luftdaten/luftqualitaet)
(UBA, the German Environment Agency), station by station, hour by hour.

Not affiliated with the Umweltbundesamt. The data come from its open API
(`luftdaten.umweltbundesamt.de`, version 4), used as UBA publishes it, under the
[Data licence Germany – attribution – 2.0](https://www.govdata.de/dl-de/by-2-0)
(dl-de/by-2-0). Source: Umweltbundesamt with data from the measuring networks
of the federal states and the federal government.

## What it does

- Reads the UBA stations you choose (10 at most), with no account and no key.
- Creates **one device per station**: the German air quality index (0 to 4)
  and its level as a word, the pollutants of the index the station measures
  (PM2.5, PM10, NO₂, O₃, SO₂) and the age of the data.
- Adds a **UBA air quality** dashboard widget, three scene triggers (**air
  quality degraded**, **back to normal**, **pollutant level degraded**) and a
  scene action **Get the air quality**.
- Finds a station by its name, city or code, or the nearest ones to your house.

Read only: the integration only reads public data.

## Requirements

- Gladys Assistant 5.3.0 or later.
- Internet access from Gladys to `luftdaten.umweltbundesamt.de`.
- To search around your house: its location, in **Settings → Houses**.

## Configuration

### Choose the stations

1. Open the integration's **Configuration** tab.
2. Click **Find a station**: type a name, a city or a station code (`Köln`,
   `Munchen`, `DEBE010`: accents are optional), or leave it empty to list the
   active stations nearest to your house, with their distance.
3. Copy the numbers you want into **Stations**, separated by commas: for
   example `121, 21`. Save.
4. In the **Discovery** tab, add the stations to Gladys.

The [map of the stations](https://www.umweltbundesamt.de/daten/luft/luftdaten/luftqualitaet)
shows them all.

### Other settings

- **Refresh**: every 30 minutes (default) or every hour. UBA publishes each
  hour once the states have sent it, often one to two hours later: reading more
  often would bring nothing.
- **Language**: language of the feature names (set when a device is added, so
  choose it first) and of the scene texts. French by default.

The **Check the stations** button reads every station now and tells what each
one answers.

## Devices

One device per station, named `UBA <station>`.

| Feature                   | Values                                               |
| ------------------------- | ---------------------------------------------------- |
| Air quality index         | 0 to 4 (German index, below)                         |
| Air quality               | the level as a word, in your language                |
| PM2.5, PM10, NO₂, O₃, SO₂ | µg/m³, the values the index is computed with         |
| Measurement age           | minutes since the end of the hour of the latest data |

Only the pollutants the station measures are created. NO₂, O₃ and SO₂ are
hourly averages; PM10 and PM2.5 are 24-hour averages updated every hour, as
UBA uses them for the index.

The **German air quality index** has five levels: 0 Very good (sehr gut),
1 Good (gut), 2 Moderate (mäßig), 3 Poor (schlecht), 4 Very poor (sehr
schlecht). UBA computes it every hour from NO₂, O₃, PM10, PM2.5 and SO₂; the
worst pollutant sets it.

A value older than 3 hours is no longer published as current: Gladys keeps
the last one with its date, and the widget says the data are outdated.

## Widget

**UBA air quality**:

- with a station chosen: up to four pollutant tiles, the index level colored
  (green, orange, red) and the age of the data;
- without: one row per station, its level colored.

The **Hide** setting removes the pollutant tiles, the age line or the source
line.

## Scenes

### Trigger: UBA: air quality degraded

Fires when the index of a station rises to **Moderate** or worse, or gets
worse again (Moderate then Poor fires twice). Filters: the station, and the
**new level**: tick the levels from your threshold up (for example Poor and
Very poor). Information for the actions: station name, level, its index, the
previous index, the pollutant that sets the level, a ready-made summary.

### Trigger: UBA: air quality back to normal

Fires when the index comes back to **Good** or **Very good** after a
degradation. Filters: the station, and the worst level the degradation
reached (tick the same levels as above to pair both scenes). Information: the
new level, the worst level reached, a summary.

### Trigger: UBA: pollutant level degraded

Fires when the sub-index of **one pollutant** rises to **Moderate** or worse,
or gets worse again: ozone on a summer afternoon, PM10 on a winter evening.
Filters: the station, the pollutants, the new level. Information: station
name, pollutant, level, its index, the value in µg/m³, a summary.

The first index read after the installation sets the starting levels and fires
nothing; a restart does not fire the same change twice.

### Action: UBA: get the air quality

The air quality of one station, or of the station with the worst index:
summary, level, index, pollutant, PM2.5, PM10, NO₂, O₃, SO₂ and the age of the
data, for the next actions (a message, a condition).

## Scene examples

- **Close the windows**: trigger _air quality degraded_ with the levels Poor
  and Very poor → send `{{triggerEvent.data.summary}}` and switch the
  ventilation off.
- **Air again**: trigger _back to normal_ with the same levels → send "You can
  open the windows again".
- **Ozone alert**: trigger _pollutant level degraded_ with O₃ and the levels
  from Moderate up → close the blinds and send a message.
- **Morning briefing**: at 7:30, action _get the air quality_ without station,
  then send its summary in the morning message.
- **Your own threshold**: when the PM2.5 feature of your station goes above
  25 µg/m³, switch the air purifier on (Gladys's own device trigger).

## Troubleshooting

- **"No station yet"** on the Configuration screen: type at least one station
  number in **Stations**.
- **"not a UBA station"** in the check: the number is not a UBA station id; use
  **Find a station** (the number, not the code like `DEBE010`).
- **"no data in the last 24 hours"**: the station is closed or out of order;
  the search only lists the active stations.
- **A pollutant missing**: the station does not measure it (many stations have
  no ozone or no SO₂).
- **"The UBA API does not answer"**: the values are kept and read again at the
  next refresh. The Logs tab tells the error once, and its end.
- Details in the integration's **Logs** tab (`LOG_LEVEL=debug` for more).

## Limits

- Hourly data, sent by the states to UBA with a delay: the values lag by 1 to
  2 hours, and the current year's data are not yet validated.
- These are measurements, not forecasts.
- UBA publishes no request quota: the integration reads 10 stations at most,
  one request per station and per refresh, and the station list once a day.
- The triggers follow UBA's hourly index as published: an index that hesitates
  between two levels fires each change.
