// -----------------------------------------------------------------------------
// A simulated UBA API v4, answering with the real responses recorded on
// 2026-11-19 around 21:50 CET (test/fixtures/uba): the station list, and the
// air quality of 18–19 November for Berlin Wedding (121), Potsdam-Zentrum (21),
// München/Stachus (471, no ozone) and Elsterwerda (7, closed in 2021: no data).
// A station the API does not know answers HTTP 409 with an HTML page, as v4
// does. Tests never touch the real network.
// -----------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs';

const url = (name) => new URL(`../fixtures/uba/${name}.json`, import.meta.url);

/** A recorded answer, parsed (null when there is none). */
export function fixture(name) {
  return existsSync(url(name)) ? JSON.parse(readFileSync(url(name), 'utf8')) : null;
}

/** The stations of the fixtures. */
export const BERLIN = '121';
export const POTSDAM = '21';
export const MUNICH = '471';
export const CLOSED = '7';

/** End of the newest hour of the fixtures: 2026-11-19 20:00 CET. */
export const NEWEST_AT = Date.parse('2026-11-19T19:00:00Z');

/** "2026-11-19 20:00:00" (CET) of an instant. */
function cet(ms) {
  return new Date(ms + 3_600_000).toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * The recorded answer of a station, with one more hour after the newest: its
 * end `hours` after 20:00, the overall level, and the level of some
 * pollutants (component id: level), values copied from the newest hour.
 * @param {string} station
 * @param {number} hours
 * @param {number} level
 * @param {Record<number, number>} [componentLevels]
 */
export function withHour(station, hours, level, componentLevels = {}) {
  const body = fixture(`aq-${station}`);
  const rows = body.data[station];
  const newest = Object.values(rows).at(-1);
  const end = NEWEST_AT + hours * 3_600_000;
  const components = newest.slice(3).map((component) => {
    const copy = [...component];
    copy[2] = componentLevels[copy[0]] ?? Math.min(copy[2], level);
    return copy;
  });
  rows[cet(end - 3_600_000)] = [cet(end), level, 0, ...components];
  return body;
}

/**
 * @param {object} [options]
 * @param {() => number} [options.now] the clock passed to the route functions
 */
export function createNetwork({ now = () => Date.now() } = {}) {
  const calls = [];
  const network = {
    calls,
    /** Overrides by station id: a body, a function (now) => body, an Error, or { status }. */
    aq: {},
    stations: null,
    /** The whole API unreachable. */
    down: false,
    fetch,
  };

  const json = (body) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  function answer(route, fallback) {
    const value = typeof route === 'function' ? route(now()) : route;
    if (value instanceof Error) {
      throw value;
    }
    if (value && typeof value === 'object' && Object.keys(value).length === 1 && value.status) {
      return new Response('<!DOCTYPE html><html>error</html>', {
        status: value.status,
        headers: { 'content-type': 'text/html' },
      });
    }
    return json(value ?? fallback);
  }

  async function fetch(href) {
    const path = String(href).replace('https://luftdaten.umweltbundesamt.de/api/air-data/v4', '');
    calls.push(path);
    if (network.down) {
      throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
    }
    if (path.startsWith('/stations/json')) {
      return answer(network.stations, fixture('stations'));
    }
    if (path.startsWith('/airquality/json?')) {
      const station = new URLSearchParams(path.split('?')[1]).get('station');
      return answer(network.aq[station] ?? fixture(`aq-${station}`) ?? { status: 409 });
    }
    return new Response('not found', { status: 404 });
  }

  return network;
}
