// -----------------------------------------------------------------------------
// The integration end to end, on the SDK's fake Gladys and the real UBA
// answers: discovery, states, freshness, the container's own polling, the
// scene triggers, the status of the Configuration screen.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAll, createWorld, discovered, featureId } from './helpers/world.js';
import { BERLIN, CLOSED, MUNICH, POTSDAM, fixture, withHour } from './helpers/network.js';
import { MemoryStore } from '../src/store.js';
import { TEXT } from '../src/i18n.js';

const HOUR = 3_600_000;
const ALL = [BERLIN, POTSDAM, MUNICH].join(',');
const AQ = '/airquality/json?';

test('one device per station, named after the UBA list, with what it measures', async () => {
  const w = await createWorld({ config: { stations: ALL } });
  const keys = (id) => discovered(w, id).features.map((f) => f.external_id.split(':').pop());
  assert.equal(discovered(w, BERLIN).name, 'UBA Berlin Wedding');
  assert.deepEqual(keys(BERLIN), ['index', 'quality', 'pm25', 'pm10', 'no2', 'o3', 'age']);
  assert.deepEqual(keys(POTSDAM), ['index', 'quality', 'pm25', 'pm10', 'no2', 'o3', 'so2', 'age']);
  // München/Stachus measures no ozone: no feature for it.
  assert.deepEqual(keys(MUNICH), ['index', 'quality', 'pm25', 'pm10', 'no2', 'age']);
  assert.equal(discovered(w, BERLIN).should_poll, false);
  assert.equal(discovered(w, BERLIN).features[0].name, "Indice de qualité de l'air");
  // Nothing is published for a device not added to Gladys.
  assert.deepEqual(w.gladys.fake.states, []);
  assert.deepEqual(w.gladys.fake.connectionStatus, { connected: true });
});

test('the states of an added station: index, its word, pollutants, age', async () => {
  const w = await createWorld({ config: { stations: ALL } });
  await createAll(w);
  const last = (id, key) => w.gladys.fake.lastState(featureId(w, id, key));
  assert.equal(last(BERLIN, 'index'), 1);
  assert.equal(last(BERLIN, 'quality'), 'Bon');
  assert.equal(last(BERLIN, 'pm25'), 4);
  assert.equal(last(BERLIN, 'pm10'), 6);
  assert.equal(last(BERLIN, 'no2'), 19);
  assert.equal(last(BERLIN, 'o3'), 47);
  assert.equal(last(BERLIN, 'age'), 20);
  assert.equal(last(POTSDAM, 'so2'), 1);
  assert.equal(last(MUNICH, 'no2'), 11);
  assert.ok(w.gladys.fake.widgetRefreshes.includes('air_quality'));
});

test('a device added again gets every state again, even unchanged', async () => {
  const w = await createWorld({ config: { stations: BERLIN } });
  await createAll(w);
  const before = w.gladys.fake.states.length;
  await w.gladys.fake.deviceCreated(discovered(w, BERLIN));
  assert.equal(w.gladys.fake.states.length - before, 7, 'index, quality, 4 pollutants, age');
});

test('a closed station, or one unknown to UBA, gives no device', async () => {
  const w = await createWorld({ config: { stations: `${CLOSED},999999` } });
  assert.deepEqual(w.gladys.fake.discoveredDevices, []);
  const ack = await w.gladys.fake.action('check_stations', {});
  assert.equal(ack.success, false);
  assert.equal(
    ack.error.en,
    [
      '#7 Elsterwerda, 1992-2020: no data in the last 24 hours (closed or out of order?)',
      '#999999: not a UBA station (see "Find a station")',
    ].join('\n'),
  );
});

test('an old value is never published as current', async () => {
  const w = await createWorld({ config: { stations: BERLIN } });
  w.advance(4 * HOUR); // UBA stuck on 20:00: the data are 4 h 20 old
  await createAll(w);
  const last = (key) => w.gladys.fake.lastState(featureId(w, BERLIN, key));
  assert.equal(last('pm25'), undefined);
  assert.equal(last('index'), undefined);
  assert.equal(last('age'), 260);
});

test('a pollutant missing from the newest hour keeps its value of the hour before', async () => {
  const w = await createWorld({
    config: { stations: BERLIN },
    setup: (network) => {
      const body = fixture(`aq-${BERLIN}`);
      const rows = body.data[BERLIN];
      const newest = Object.keys(rows).at(-1);
      rows[newest] = rows[newest].filter((item) => !Array.isArray(item) || item[0] !== 3);
      network.aq[BERLIN] = body;
    },
  });
  await createAll(w);
  assert.equal(w.gladys.fake.lastState(featureId(w, BERLIN, 'o3')), 56);
  assert.equal(w.gladys.fake.lastState(featureId(w, BERLIN, 'no2')), 19);
});

test('the container reads the added stations on its own timer, not on onPoll', async () => {
  const w = await createWorld({ config: { stations: `${BERLIN},${POTSDAM}` } });
  await w.gladys.fake.deviceCreated(discovered(w, BERLIN));
  const count = (path) => w.network.calls.filter((call) => call.startsWith(path)).length;
  const before = count(AQ);
  // Within the period: nothing read again.
  w.advance(20 * 60_000);
  await w.app.poller.cycle();
  assert.equal(count(AQ), before);
  // Past it: the added station only (Potsdam was read once, for discovery).
  w.advance(10 * 60_000);
  await w.app.poller.cycle();
  assert.match(w.network.calls.at(-1), new RegExp(`station=${BERLIN}$`));
  assert.equal(count(AQ), before + 1);
  // The station list is read once a day at most.
  assert.equal(count('/stations/json'), 1);
});

test('the request covers the last CET day', async () => {
  const w = await createWorld({ config: { stations: BERLIN } });
  const call = w.network.calls.find((path) => path.startsWith(AQ));
  assert.equal(
    call,
    `${AQ}date_from=2026-11-18&time_from=1&date_to=2026-11-19&time_to=24&station=${BERLIN}`,
  );
});

test('scene triggers: degraded, worse, better but still degraded, back to normal', async () => {
  const w = await createWorld({ config: { stations: BERLIN, language: 'en' } });
  await createAll(w);
  // The first index sets the starting level: no event.
  assert.deepEqual(w.gladys.fake.sceneEvents, []);
  let hours = 0;
  const step = async (level) => {
    hours += 1;
    w.network.aq[BERLIN] = withHour(BERLIN, hours, level);
    w.advance(HOUR);
    await w.app.poller.cycle();
  };
  await step(2);
  await step(3);
  await step(2);
  await step(2);
  await step(1);
  await step(0);
  const events = w.gladys.fake.sceneEvents;
  assert.deepEqual(
    events.map((event) => [event.key, event.data.level]),
    [
      ['air_quality_degraded', 'moderate'],
      ['air_quality_degraded', 'poor'],
      ['air_quality_back_to_normal', 'good'],
    ],
  );
  const [first, , back] = events;
  assert.equal(first.data.station, discovered(w, BERLIN).external_id);
  assert.equal(first.data.station_name, 'UBA Berlin Wedding');
  assert.equal(first.data.level_label, 'Moderate');
  assert.equal(first.data.level_index, 2);
  assert.equal(first.data.previous_level_index, 1);
  assert.match(first.data.summary, /^UBA Berlin Wedding: Moderate · PM2\.5 4 µg\/m³/);
  assert.equal(back.data.worst_level, 'poor');
  assert.equal(back.data.worst_level_label, 'Poor');
  assert.equal(back.data.worst_level_index, 3);
});

test('a pollutant whose sub-index degrades fires its own trigger, named', async () => {
  const w = await createWorld({ config: { stations: BERLIN, language: 'de' } });
  await createAll(w);
  // NO₂ (component 5) to "moderate", then "poor"; O₃ (3) stays "good".
  w.network.aq[BERLIN] = withHour(BERLIN, 1, 2, { 5: 2 });
  w.advance(HOUR);
  await w.app.poller.cycle();
  w.network.aq[BERLIN] = withHour(BERLIN, 2, 3, { 5: 3 });
  w.advance(HOUR);
  await w.app.poller.cycle();
  const events = w.gladys.fake.sceneEvents;
  assert.deepEqual(
    events.map((event) => [event.key, event.data.level]),
    [
      ['air_quality_degraded', 'moderate'],
      ['pollutant_degraded', 'moderate'],
      ['air_quality_degraded', 'poor'],
      ['pollutant_degraded', 'poor'],
    ],
  );
  const pollutant = events[1].data;
  assert.equal(pollutant.pollutant, 'no2');
  assert.equal(pollutant.pollutant_label, 'NO₂');
  assert.equal(pollutant.level_label, 'Mäßig');
  assert.equal(pollutant.value, 19);
  assert.equal(pollutant.station_name, 'UBA Berlin Wedding');
  // The overall trigger names the pollutant that sets the level.
  assert.equal(events[0].data.pollutant, 'NO₂');
});

test('no event for a station not added, nor twice after a restart', async () => {
  const store = new MemoryStore();
  const w = await createWorld({ config: { stations: BERLIN }, store });
  w.network.aq[BERLIN] = withHour(BERLIN, 1, 3, { 5: 3 });
  w.advance(HOUR);
  await w.app.poller.refreshNow([BERLIN]);
  assert.deepEqual(w.gladys.fake.sceneEvents, []);
  await w.app.stop();

  // Restarted, the device now added: the same index is not news.
  const devices = w.gladys.fake.discoveredDevices;
  const again = await createWorld({
    config: { stations: BERLIN },
    store,
    devices,
    setup: (network) => {
      network.aq[BERLIN] = withHour(BERLIN, 1, 3, { 5: 3 });
    },
  });
  again.advance(HOUR);
  await again.app.poller.refreshNow([BERLIN]);
  assert.equal(again.gladys.fake.lastState(featureId(again, BERLIN, 'index')), 3);
  assert.deepEqual(again.gladys.fake.sceneEvents, []);
  // The device names and pollutants come back from /data, before any read.
  const offline = await createWorld({
    config: { stations: BERLIN },
    store,
    setup: (network) => {
      network.down = true;
    },
  });
  assert.equal(discovered(offline, BERLIN).features.length, 7);
});

test('the status: nothing configured, API down and back', async () => {
  const empty = await createWorld();
  assert.deepEqual(empty.gladys.fake.connectionStatus, {
    connected: false,
    message: TEXT.notConfigured,
  });

  const w = await createWorld({ config: { stations: BERLIN } });
  await createAll(w);
  w.network.down = true;
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.deepEqual(w.gladys.fake.connectionStatus, {
    connected: false,
    message: TEXT.apiUnreachable,
  });
  w.network.down = false;
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.deepEqual(w.gladys.fake.connectionStatus, { connected: true });
});

test('onPoll, should the core call it, reads only a station that is due', async () => {
  const w = await createWorld({ config: { stations: BERLIN } });
  await createAll(w);
  const before = w.network.calls.length;
  await w.gladys.fake.poll(discovered(w, BERLIN));
  assert.equal(w.network.calls.length, before);
  w.advance(HOUR);
  await w.gladys.fake.poll(discovered(w, BERLIN));
  assert.ok(w.network.calls.length > before);
});

test('a device added days after the configuration fires nothing at once', async () => {
  const w = await createWorld({ config: { stations: BERLIN } });
  // Read once for the Discovery tab (index 1), then not read while not added.
  w.advance(48 * HOUR);
  w.network.aq[BERLIN] = withHour(BERLIN, 48, 3);
  await createAll(w);
  assert.equal(w.gladys.fake.lastState(featureId(w, BERLIN, 'index')), 3);
  assert.deepEqual(w.gladys.fake.sceneEvents, []);
  // From there, a change does fire.
  w.network.aq[BERLIN] = withHour(BERLIN, 49, 4);
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.deepEqual(
    w.gladys.fake.sceneEvents.map((event) => event.data.level),
    ['very_poor'],
  );
});

test('an event Gladys refused is sent at the next cycle, an event sent is not sent again', async () => {
  const store = new MemoryStore();
  const w = await createWorld({ config: { stations: BERLIN }, store });
  await createAll(w);
  const publish = w.gladys.publishSceneEvent.bind(w.gladys);
  let refuse = true;
  w.gladys.publishSceneEvent = async (...args) => {
    if (refuse) {
      refuse = false;
      throw new Error('HTTP 429');
    }
    return publish(...args);
  };
  w.network.aq[BERLIN] = withHour(BERLIN, 1, 3);
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.deepEqual(w.gladys.fake.sceneEvents, []);
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.deepEqual(
    w.gladys.fake.sceneEvents.map((event) => event.key),
    ['air_quality_degraded'],
  );
  await w.app.stop();

  // Restarted on the same /data, the same index: nothing new.
  const again = await createWorld({
    config: { stations: BERLIN },
    store,
    devices: w.gladys.fake.discoveredDevices,
    setup: (network) => {
      network.aq[BERLIN] = withHour(BERLIN, 1, 3);
    },
  });
  again.advance(2 * HOUR);
  await again.app.poller.refreshNow([BERLIN]);
  assert.deepEqual(again.gladys.fake.sceneEvents, []);
});

test('the station list refused: asked again after a pause, not by every station', async () => {
  const w = await createWorld({
    config: { stations: ALL },
    setup: (network) => {
      network.stations = { status: 503 };
    },
  });
  const lists = () => w.network.calls.filter((call) => call.startsWith('/stations/json'));
  assert.equal(lists().length, 1);
  // The stations are read all the same, named by their number.
  assert.equal(discovered(w, BERLIN).name, 'UBA #121');
  await createAll(w);
  assert.equal(lists().length, 1);
  w.network.stations = null;
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.equal(lists().length, 2);
  assert.equal(discovered(w, BERLIN).name, 'UBA Berlin Wedding');
});

test('one station failing does not stop the others nor the status', async () => {
  const w = await createWorld({
    config: { stations: `${BERLIN},${POTSDAM}` },
    setup: (network) => {
      network.aq[POTSDAM] = { status: 500 };
    },
  });
  await createAll(w);
  assert.equal(w.gladys.fake.lastState(featureId(w, BERLIN, 'pm25')), 4);
  assert.deepEqual(w.gladys.fake.connectionStatus, { connected: true });
});

test('a revised hour that changes the level fires the trigger', async () => {
  const w = await createWorld({ config: { stations: BERLIN, language: 'en' } });
  await createAll(w);
  w.network.aq[BERLIN] = withHour(BERLIN, 1, 1);
  w.advance(HOUR);
  await w.app.poller.cycle();
  w.network.aq[BERLIN] = withHour(BERLIN, 1, 3);
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.deepEqual(
    w.gladys.fake.sceneEvents.map((event) => event.data.level),
    ['poor'],
  );
});

test('a reconnection does not read again the stations just read', async () => {
  const w = await createWorld({ config: { stations: BERLIN } });
  await createAll(w);
  const count = () => w.network.calls.filter((call) => call.startsWith(AQ)).length;
  const before = count();
  w.advance(60_000);
  await w.app.poller.restart();
  assert.equal(count(), before);
  w.advance(10 * 60_000);
  await w.app.poller.restart();
  assert.equal(count(), before + 1);
  w.app.poller.stop();
});

test('server errors on every station: the status says the API does not answer', async () => {
  const w = await createWorld({ config: { stations: `${BERLIN},${POTSDAM}` } });
  await createAll(w);
  w.network.aq[BERLIN] = { status: 503 };
  w.network.aq[POTSDAM] = { status: 503 };
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.deepEqual(w.gladys.fake.connectionStatus, {
    connected: false,
    message: TEXT.apiUnreachable,
  });
});
