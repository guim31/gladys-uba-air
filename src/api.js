// -----------------------------------------------------------------------------
// The UBA air data API v4 (https://luftdaten.umweltbundesamt.de/api/air-data/v4),
// open, without key. Its answers are positional arrays: this module is the
// only place that knows the positions, and returns neutral objects to the
// rest of the code.
//
// The v3 (www.umweltbundesamt.de/api/air_data/v3) is deprecated and stops on
// 2027-02-01. UBA publishes no request quota: the integration reads each
// station at most every 30 minutes, one request per station, and the station
// list once a day.
//
// Data licence Germany – attribution – 2.0. Source: "Umweltbundesamt mit Daten
// der Messnetze der Länder und des Bundes".
// -----------------------------------------------------------------------------

import { cetDate, parseCetTime } from './time.js';

export const API_URL = 'https://luftdaten.umweltbundesamt.de/api/air-data/v4';

const TIMEOUT_MS = 20_000;

const USER_AGENT = 'gladys-uba-air (+https://github.com/guim31/gladys-uba-air)';

/** The pollutants of the UBA index, by component id, and our keys. */
export const POLLUTANT_BY_COMPONENT = { 1: 'pm10', 3: 'o3', 4: 'so2', 5: 'no2', 9: 'pm25' };

/** The index runs from 0 (very good) to 4 (very poor). */
const MAX_LEVEL = 4;

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, unreachable?: boolean, unknown?: boolean }} [details]
   */
  constructor(message, { status, unreachable = false, unknown = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    /** No answer at all (DNS, network, timeout): one problem for every station. */
    this.unreachable = unreachable;
    /** The API does not know the station (HTTP 409). */
    this.unknown = unknown;
  }
}

/**
 * GET a path of the API, as JSON.
 * @param {string} path
 * @param {{ fetch?: typeof fetch }} [deps]
 */
async function getJson(path, { fetch: fetchImpl = globalThis.fetch } = {}) {
  let response;
  try {
    response = await fetchImpl(`${API_URL}${path}`, {
      headers: { accept: 'application/json', 'user-agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err.name === 'TimeoutError' ? 'timeout' : err.cause?.code || err.message;
    throw new ApiError(`UBA API unreachable (${reason})`, { unreachable: true });
  }
  if (response.status === 409) {
    // What v4 answers (an HTML page) for a station id it does not know.
    throw new ApiError('UBA API: unknown station', { status: 409, unknown: true });
  }
  if (!response.ok) {
    throw new ApiError(`UBA API: HTTP ${response.status}`, { status: response.status });
  }
  let body = null;
  try {
    body = await response.json();
  } catch {
    // A missing parameter gets a 200 with a plain text sentence.
  }
  if (!body || typeof body !== 'object') {
    throw new ApiError('UBA API: unreadable answer', { status: response.status });
  }
  return body;
}

const toNumber = (value) => {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
};

/** An index level, 0 to 4, or null. */
function level(value) {
  const number = toNumber(value);
  return Number.isInteger(number) && number >= 0 && number <= MAX_LEVEL ? number : null;
}

/**
 * Every station of the networks, active or closed (one request: cache it).
 * @param {{ fetch?: typeof fetch }} [deps]
 * @returns {Promise<Array<{ id: string, code: string, name: string, city: string, network: string, lat: number|null, lon: number|null, active: boolean }>>}
 */
export async function fetchStations(deps) {
  const body = await getJson('/stations/json?use=airquality&lang=en', deps);
  const indices = Array.isArray(body.indices) ? body.indices : [];
  const at = (name) => indices.indexOf(name);
  const position = {
    id: at('station id'),
    code: at('station code'),
    name: at('station name'),
    city: at('station city'),
    to: at('station active to'),
    lon: at('station longitude'),
    lat: at('station latitude'),
    network: at('network code'),
  };
  if (!body.data || typeof body.data !== 'object' || position.id < 0 || position.name < 0) {
    throw new ApiError('UBA API: no station list in the answer');
  }
  const stations = [];
  for (const row of Object.values(body.data)) {
    if (!Array.isArray(row)) {
      continue;
    }
    const id = toNumber(row[position.id]);
    if (id === null) {
      continue;
    }
    const text = (key) => (position[key] < 0 ? '' : String(row[position[key]] ?? '').trim());
    stations.push({
      id: String(id),
      code: text('code'),
      name: text('name') || `#${id}`,
      city: text('city'),
      network: text('network'),
      lat: position.lat < 0 ? null : toNumber(row[position.lat]),
      lon: position.lon < 0 ? null : toNumber(row[position.lon]),
      active: position.to < 0 || row[position.to] === null || row[position.to] === '',
    });
  }
  return stations;
}

/**
 * The air quality hours of a station over the last day (CET), oldest first.
 * An empty list: the station exists but sent nothing (closed, or a gap).
 * @param {string} stationId
 * @param {{ fetch?: typeof fetch, now?: () => number }} [deps]
 * @returns {Promise<Array<{ at: number, level: number|null, incomplete: boolean, pollutants: Record<string, { value: number, level: number|null }> }>>}
 */
export async function fetchAirQuality(stationId, deps = {}) {
  const now = deps.now?.() ?? Date.now();
  const query = new URLSearchParams({
    date_from: cetDate(now - 24 * 3_600_000),
    time_from: '1',
    date_to: cetDate(now),
    time_to: '24',
    station: String(stationId),
  });
  const body = await getJson(`/airquality/json?${query}`, deps);
  const byStation = body.data;
  if (!byStation || typeof byStation !== 'object') {
    throw new ApiError('UBA API: no data in the answer');
  }
  const hours = byStation[String(stationId)];
  if (!hours || typeof hours !== 'object') {
    return [];
  }
  const items = [];
  for (const row of Object.values(hours)) {
    // [end of the hour, index, incomplete, [component, value, index, y-value]...]
    if (!Array.isArray(row)) {
      continue;
    }
    const at = parseCetTime(row[0]);
    if (at === null) {
      continue;
    }
    const pollutants = {};
    for (const component of row.slice(3)) {
      const key = Array.isArray(component) ? POLLUTANT_BY_COMPONENT[component[0]] : undefined;
      const value = key ? toNumber(component[1]) : null;
      if (key && value !== null) {
        pollutants[key] = { value, level: level(component[2]) };
      }
    }
    items.push({ at, level: level(row[1]), incomplete: row[2] === 1, pollutants });
  }
  return items.sort((a, b) => a.at - b.at);
}
