// -----------------------------------------------------------------------------
// The UBA client against the real answers recorded on 2026-11-19
// (test/fixtures/uba), and the CET dates of the API.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, fetchAirQuality, fetchStations } from '../src/api.js';
import { cetDate, parseCetTime } from '../src/time.js';
import { BERLIN, CLOSED, MUNICH, NEWEST_AT, createNetwork } from './helpers/network.js';

const NOW = Date.parse('2026-11-19T20:50:00Z');

const deps = () => {
  const network = createNetwork();
  return { network, deps: { fetch: network.fetch, now: () => NOW } };
};

test('the station list: ids, codes, names, coordinates, closed ones flagged', async () => {
  const { deps: d, network } = deps();
  const stations = await fetchStations(d);
  assert.equal(stations.length, 494);
  assert.equal(stations.filter((station) => station.active).length, 430);
  assert.deepEqual(
    stations.find((station) => station.id === BERLIN),
    {
      id: '121',
      code: 'DEBE010',
      name: 'Berlin Wedding',
      city: 'Berlin',
      network: 'BE',
      lat: 52.543,
      lon: 13.3493,
      active: true,
    },
  );
  assert.equal(stations.find((station) => station.id === CLOSED).active, false);
  assert.deepEqual(network.calls, ['/stations/json?use=airquality&lang=en']);
});

test('the air quality hours: index, incomplete flag, pollutants of the index', async () => {
  const { deps: d, network } = deps();
  const hours = await fetchAirQuality(BERLIN, d);
  assert.equal(hours.length, 44);
  assert.deepEqual(hours.at(-1), {
    at: NEWEST_AT,
    level: 1,
    incomplete: true,
    pollutants: {
      pm25: { value: 4, level: 0 },
      pm10: { value: 6, level: 0 },
      o3: { value: 47, level: 1 },
      no2: { value: 19, level: 1 },
    },
  });
  assert.ok(hours.every((hour, i) => i === 0 || hour.at > hours[i - 1].at));
  assert.equal(
    network.calls[0],
    '/airquality/json?date_from=2026-11-18&time_from=1&date_to=2026-11-19&time_to=24&station=121',
  );
  // München/Stachus: no ozone measured.
  const munich = await fetchAirQuality(MUNICH, d);
  assert.deepEqual(Object.keys(munich.at(-1).pollutants), ['pm25', 'pm10', 'no2']);
});

test('a closed station answers no hour; an unknown one is recognized', async () => {
  const { deps: d } = deps();
  assert.deepEqual(await fetchAirQuality(CLOSED, d), []);
  await assert.rejects(fetchAirQuality('999999', d), (err) => {
    assert.ok(err instanceof ApiError);
    assert.equal(err.unknown, true);
    assert.equal(err.status, 409);
    return true;
  });
});

test('odd rows are skipped: unknown component, bad level, bad date', async () => {
  const { network, deps: d } = deps();
  network.aq[BERLIN] = {
    data: {
      [BERLIN]: {
        a: ['2026-11-19 20:00:00', 7, 0, [5, 19, 9, '9'], [6, 1, 0, '0'], [1, 'x', 0, '0']],
        b: ['yesterday', 1, 0, [5, 19, 1, '1']],
        c: 'nonsense',
      },
    },
  };
  assert.deepEqual(await fetchAirQuality(BERLIN, d), [
    {
      at: NEWEST_AT,
      level: null,
      incomplete: false,
      pollutants: { no2: { value: 19, level: null } },
    },
  ]);
});

test('errors: HTTP status, text answer, unreachable API', async () => {
  const { network, deps: d } = deps();
  network.aq[BERLIN] = { status: 503 };
  await assert.rejects(fetchAirQuality(BERLIN, d), { name: 'ApiError', status: 503 });
  network.aq[BERLIN] = 'Please provide parameter date_from!';
  await assert.rejects(fetchAirQuality(BERLIN, d), /no data in the answer|unreadable/);
  network.stations = { nothing: 'here', count: 0 };
  await assert.rejects(fetchStations(d), /no station list/);
  network.down = true;
  await assert.rejects(fetchAirQuality(BERLIN, d), (err) => {
    assert.equal(err.status, undefined);
    assert.equal(err.unreachable, true);
    assert.match(err.message, /unreachable \(ENOTFOUND\)/);
    return true;
  });
});

test('CET all year round, whatever the time zone of the container', () => {
  assert.equal(parseCetTime('2026-01-15 12:00:00'), Date.parse('2026-01-15T11:00:00Z'));
  // Summer too: UBA keeps CET (on 2026-03-29 it lists a 02:00 hour).
  assert.equal(parseCetTime('2026-07-15 12:00:00'), Date.parse('2026-07-15T11:00:00Z'));
  assert.equal(parseCetTime('2026-11-19 24:00:00'), Date.parse('2026-11-19T23:00:00Z'));
  assert.equal(parseCetTime(null), null);
  assert.equal(parseCetTime('yesterday'), null);
  assert.equal(parseCetTime('2026-13-01 00:00:00'), null);
  assert.equal(cetDate(Date.parse('2026-11-19T22:59:00Z')), '2026-11-19');
  assert.equal(cetDate(Date.parse('2026-11-19T23:00:00Z')), '2026-11-20');
});
