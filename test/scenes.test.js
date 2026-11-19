// -----------------------------------------------------------------------------
// The scene action "Get the air quality": one station, or the worst one.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAll, createWorld, discovered } from './helpers/world.js';
import { BERLIN, MUNICH, POTSDAM, withHour } from './helpers/network.js';

async function world(language = 'fr') {
  const w = await createWorld({
    config: { stations: [BERLIN, POTSDAM, MUNICH].join(','), language },
    setup: (network) => {
      network.aq[MUNICH] = withHour(MUNICH, 0, 3, { 1: 3 });
    },
  });
  await createAll(w);
  return w;
}

test('one station: its level, values and a sentence', async () => {
  const w = await world('en');
  const ack = await w.gladys.fake.sceneAction('get_air_quality', {
    station: discovered(w, POTSDAM).external_id,
  });
  assert.equal(ack.success, true, ack.error);
  assert.deepEqual(ack.data.outputs ?? ack.data, {
    station_name: 'UBA Potsdam-Zentrum',
    level: 'good',
    level_index: 1,
    level_label: 'Good',
    pm25: 4,
    pm10: 6,
    no2: 10,
    o3: 65,
    so2: 1,
    age_minutes: 20,
    summary:
      'UBA Potsdam-Zentrum: Good · PM2.5 4 µg/m³ · PM10 6 µg/m³ · NO₂ 10 µg/m³ · O₃ 65 µg/m³',
  });
});

test('no station chosen: the worst index, and the pollutant behind it', async () => {
  const w = await world();
  const ack = await w.gladys.fake.sceneAction('get_air_quality', {});
  assert.equal(ack.success, true, ack.error);
  const outputs = ack.data.outputs ?? ack.data;
  assert.equal(outputs.station_name, 'UBA München/Stachus');
  assert.equal(outputs.level_label, 'Mauvais');
  assert.equal(outputs.o3, undefined, 'not measured: left out');
  assert.equal(outputs.pollutant, 'PM10');
});

test('nothing recent: the action fails with a message in four languages', async () => {
  const w = await world();
  w.advance(5 * 3_600_000);
  const ack = await w.gladys.fake.sceneAction('get_air_quality', {});
  assert.equal(ack.success, false);
  assert.equal(ack.error.en, 'No air quality reading yet.');
  assert.equal(ack.error.fr, "Pas encore de relevé de la qualité de l'air.");
});
