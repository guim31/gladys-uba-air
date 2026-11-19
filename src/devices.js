// -----------------------------------------------------------------------------
// The Gladys devices: one per UBA station.
//
// External ids (forever, see CLAUDE.md):
//   ext:<selector>:station:<UBA station id>
//   features :index, :quality, :pm25, :pm10, :no2, :o3, :so2, :age
//
// Features:
//   - index   : the German air quality index (Luftqualitätsindex) of UBA,
//               `airquality-sensor/aqi`, 0 (very good) to 4 (very poor), the
//               official scale;
//   - quality : the level as a word, in the configured language (text/text);
//   - the pollutants of the index the station measures, in µg/m³, as UBA
//     computes the index with them: hourly averages for NO₂, O₃ and SO₂, a
//     floating 24-hour average for PM10 and PM2.5;
//   - age     : minutes since the end of the hour the last data refer to.
//
// The pollutants are learnt from the station's answers, kept under /data, and
// never removed: a feature is an external id Gladys keeps.
// -----------------------------------------------------------------------------

import {
  DEVICE_FEATURE_CATEGORIES as CATEGORIES,
  DEVICE_FEATURE_TYPES as TYPES,
  DEVICE_FEATURE_UNITS as UNITS,
} from '@gladysassistant/integration-sdk';
import { NAMES } from './i18n.js';

/** The pollutants, in display order. */
export const POLLUTANTS = ['pm25', 'pm10', 'no2', 'o3', 'so2'];

export const INDEX_KEY = 'index';
export const QUALITY_KEY = 'quality';
export const AGE_KEY = 'age';

const DEVICE_TYPE = 'station';

const concentration = (category, type, max) => ({
  category,
  type,
  unit: UNITS.MICROGRAM_PER_CUBIC_METER,
  min: 0,
  max,
  keep_history: true,
});

// min/max are display bounds (Gladys never clamps a state with them).
const SHAPES = {
  index: {
    category: CATEGORIES.AIRQUALITY_SENSOR,
    type: TYPES.AIRQUALITY_SENSOR.AQI,
    unit: UNITS.AQI,
    min: 0,
    max: 4,
    keep_history: true,
  },
  quality: {
    category: CATEGORIES.TEXT,
    type: TYPES.TEXT.TEXT,
    min: 0,
    max: 0,
    keep_history: false,
  },
  pm25: concentration(CATEGORIES.PM25_SENSOR, TYPES.SENSOR.DECIMAL, 500),
  pm10: concentration(CATEGORIES.PM10_SENSOR, TYPES.SENSOR.DECIMAL, 500),
  no2: concentration(CATEGORIES.NO2_SENSOR, TYPES.SENSOR.DECIMAL, 500),
  o3: concentration(CATEGORIES.O3_SENSOR, TYPES.SENSOR.DECIMAL, 500),
  so2: concentration(CATEGORIES.SO2_SENSOR, TYPES.SENSOR.DECIMAL, 500),
  // A week on the scale; an older measurement still gets its real age.
  age: {
    category: CATEGORIES.DURATION,
    type: TYPES.DURATION.INTEGER,
    unit: UNITS.MINUTES,
    min: 0,
    max: 10080,
    keep_history: false,
  },
};

/**
 * The external ids of a station.
 * @param {object} gladys
 * @param {string} stationId
 */
export function idsOf(gladys, stationId) {
  return gladys.externalIds(DEVICE_TYPE, String(stationId));
}

/** The UBA station id of a device (or feature) external id, or null. */
export function stationIdOf(externalId) {
  const match = /:station:(\d+)(?::[a-z0-9]+)?$/.exec(String(externalId ?? ''));
  return match ? match[1] : null;
}

/** The device name: the source and the station, never translated. */
export function deviceName(record) {
  return `UBA ${record.name || `#${record.id}`}`;
}

/** The pollutants of a record, in display order. */
export function pollutantsOf(record) {
  return POLLUTANTS.filter((key) => (record.pollutants ?? []).includes(key));
}

/**
 * The discovery payload of a station.
 * @param {object} gladys
 * @param {{ id: string, name?: string, pollutants?: string[] }} record
 * @param {string} language language of the feature names
 */
export function buildDevice(gladys, record, language) {
  const names = NAMES[language] ?? NAMES.fr;
  const ids = idsOf(gladys, record.id);
  const feature = (key) => ({
    name: names[key],
    external_id: ids.feature(key),
    ...SHAPES[key],
    read_only: true,
    has_feedback: false,
  });
  return {
    name: deviceName(record),
    external_id: ids.device,
    model: 'Umweltbundesamt',
    // UBA publishes hourly: the container reads the stations on its own
    // timer (src/poller.js), well beyond the 60 s the core can schedule.
    should_poll: false,
    features: [
      feature(INDEX_KEY),
      feature(QUALITY_KEY),
      ...pollutantsOf(record).map(feature),
      feature(AGE_KEY),
    ],
    params: [{ name: 'station_id', value: String(record.id) }],
  };
}
