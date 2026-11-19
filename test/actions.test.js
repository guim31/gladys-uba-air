// -----------------------------------------------------------------------------
// The buttons of the Configuration screen: find a station, check the stations.
// A failure is thrown, so Gladys shows it in red; only a success is returned.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from './helpers/world.js';
import { BERLIN } from './helpers/network.js';
import { fold, searchStations } from '../src/catalog.js';

// A house near Alexanderplatz, Berlin.
const HOUSE = { selector: 'home', name: 'Zuhause', latitude: 52.5219, longitude: 13.4132 };

test('find by name, accents optional, active stations only, sorted by name', async () => {
  const w = await createWorld({ houses: [HOUSE] });
  const ack = await w.gladys.fake.action('find_station', { query: 'koln' });
  assert.equal(ack.success, true, ack.error);
  assert.equal(
    ack.data.message.en,
    [
      'UBA stations for "koln", numbers to type in "Stations":',
      '#1254 Köln Clevischer Ring [DENW211]',
      '#1255 Köln Turiner Straße [DENW212]',
      '#1108 Köln-Chorweiler [DENW053]',
      '#1114 Köln-Rodenkirchen [DENW059]',
    ].join('\n'),
  );
});

test('find by station code', async () => {
  const w = await createWorld();
  const ack = await w.gladys.fake.action('find_station', { query: 'DEBE010' });
  assert.equal(ack.success, true, ack.error);
  assert.equal(ack.data.message.en.split('\n')[1], '#121 Berlin Wedding [DEBE010]');
});

test('no name: the nearest stations to the house, with their distance', async () => {
  const w = await createWorld({ houses: [HOUSE] });
  const ack = await w.gladys.fake.action('find_station', {});
  assert.equal(ack.success, true, ack.error);
  const lines = ack.data.message.fr.split('\n');
  assert.equal(
    lines[0],
    "Stations de l'UBA autour de Zuhause, numéros à saisir dans « Stations » :",
  );
  assert.equal(lines[1], '#175 Berlin Mitte [DEBE068] (1 km)');
  assert.equal(lines.length, 10, 'the head, 8 stations, the tail');
  // The list is kept: a second search does not ask UBA again.
  await w.gladys.fake.action('find_station', { query: 'München' });
  assert.equal(w.network.calls.filter((call) => call.startsWith('/stations/json')).length, 1);
});

test('nothing found: a failure, in red', async () => {
  const w = await createWorld();
  const ack = await w.gladys.fake.action('find_station', { query: 'Gdańsk' });
  assert.equal(ack.success, false);
  assert.equal(ack.error.fr, "Aucune station active de l'UBA pour « Gdańsk ».");
});

test('no name and no located house: the action says what to do', async () => {
  const w = await createWorld({ houses: [{ selector: 'h', name: 'H' }] });
  const ack = await w.gladys.fake.action('find_station', {});
  assert.equal(ack.success, false);
  assert.match(ack.error.en, /Settings → Houses/);
  assert.match(ack.error.fr, /Paramètres → Maisons/);
});

test('the station list unreachable: a clear message', async () => {
  const w = await createWorld({ setup: (network) => (network.down = true) });
  const ack = await w.gladys.fake.action('find_station', { query: 'Köln' });
  assert.equal(ack.success, false);
  assert.match(ack.error.en, /cannot be read now/);
  assert.match(ack.error.fr, /illisible pour le moment/);
});

test('check the stations: level, pollutants, age, and the typos', async () => {
  const w = await createWorld({ config: { stations: `${BERLIN}, abc` } });
  const ack = await w.gladys.fake.action('check_stations', {});
  assert.equal(ack.success, true, ack.error);
  assert.equal(
    ack.data.message.en,
    [
      '#121 Berlin Wedding: Good, PM2.5, PM10, NO₂, O₃ (20 min ago)',
      'Ignored, not station numbers: abc',
    ].join('\n'),
  );
});

test('check without any station: a failure', async () => {
  const w = await createWorld();
  const ack = await w.gladys.fake.action('check_stations', {});
  assert.equal(ack.success, false);
  assert.equal(ack.error.fr, "Aucune station n'est configurée.");
});

test('check with the API down: a failure', async () => {
  const w = await createWorld({ config: { stations: BERLIN } });
  w.network.down = true;
  w.advance(2 * 60_000);
  const ack = await w.gladys.fake.action('check_stations', {});
  assert.equal(ack.success, false);
  assert.match(ack.error.en, /^#121 Berlin Wedding: error \(UBA API unreachable \(ENOTFOUND\)\)/);
});

test('search helpers: folding and ordering', () => {
  assert.equal(fold('Köln Turiner Straße'), 'koln turiner strasse');
  const stations = [
    { id: '1', name: 'B', city: 'Köln', code: 'DENW1', lat: 50.9, lon: 6.9, active: true },
    { id: '2', name: 'A', city: 'Köln', code: 'DENW2', lat: null, lon: null, active: true },
    { id: '3', name: 'C', city: 'Köln', code: 'DENW3', lat: 50.9, lon: 6.9, active: false },
  ];
  assert.deepEqual(
    searchStations(stations, { query: 'koln' }).map((s) => s.id),
    ['2', '1'],
  );
  assert.deepEqual(
    searchStations(stations, { origin: { lat: 50, lon: 7 } }).map((s) => s.id),
    ['1', '2'],
  );
});
