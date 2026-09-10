import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGridOverlaySvg, parseDetectedTables, pickBackground } from "../src/lib/tablePlanDetect";
import { sortTablesById } from "../src/lib/tablePlan";

test("liest sauberes JSON", () => {
  const tables = parseDetectedTables(
    '{"tables":[{"id":"1","capacity":4,"x":12.34,"y":45,"w":8,"h":6.55},{"id":2,"capacity":null,"x":50,"y":50,"w":10,"h":10}]}'
  );
  assert.equal(tables.length, 2);
  assert.deepEqual(tables[0], { id: "1", capacity: 4, x: 12.3, y: 45, w: 8, h: 6.6 });
  assert.deepEqual(tables[1], { id: "2", capacity: null, x: 50, y: 50, w: 10, h: 10 });
});

test("toleriert Codeblock und Vorrede", () => {
  const text = 'Hier das Ergebnis:\n```json\n{"tables":[{"id":"VIP","x":1,"y":2,"w":3,"h":4}]}\n```';
  const tables = parseDetectedTables(text);
  assert.equal(tables.length, 1);
  assert.equal(tables[0].id, "VIP");
  assert.equal(tables[0].capacity, null);
});

test("begrenzt Kästen auf das Bild und verwirft Winzlinge", () => {
  const tables = parseDetectedTables(
    '{"tables":[{"id":"1","x":95,"y":95,"w":20,"h":20},{"id":"2","x":10,"y":10,"w":0.4,"h":5},{"id":"3","x":-5,"y":-5,"w":10,"h":10}]}'
  );
  assert.deepEqual(
    tables.map((t) => [t.id, t.x, t.y, t.w, t.h]),
    [
      ["1", 95, 95, 5, 5],
      ["3", 0, 0, 10, 10]
    ]
  );
});

test("macht doppelte Nummern eindeutig", () => {
  const tables = parseDetectedTables(
    '{"tables":[{"id":"7","x":1,"y":1,"w":5,"h":5},{"id":"7","x":20,"y":1,"w":5,"h":5},{"id":"7","x":40,"y":1,"w":5,"h":5}]}'
  );
  assert.deepEqual(
    tables.map((t) => t.id),
    ["7", "7-2", "7-3"]
  );
});

test("wirft verständliche Fehler", () => {
  assert.throws(() => parseDetectedTables("Ich sehe keine Tische."), /kein JSON/);
  assert.throws(() => parseDetectedTables("{tables: oops}"), /ungültiges JSON/);
  assert.throws(() => parseDetectedTables('{"foo":1}'), /erwartete Format/);
  assert.throws(() => parseDetectedTables('{"tables":[]}'), /keine Tische/);
});

test("Raster-SVG hat neun Linien je Richtung und Beschriftungen", () => {
  const svg = buildGridOverlaySvg(1000, 500);
  assert.equal((svg.match(/<line /g) ?? []).length, 18);
  assert.ok(svg.includes('x1="300" y1="0"'));
  assert.ok(svg.includes(">30<"));
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="500">'));
});

test("Hintergrund: helle Striche auf Transparenz → dunkler Grund, dunkle → heller", () => {
  // 3 Pixel: transparent, weiß, transparent → nur der weiße zählt.
  const lightStrokes = Uint8Array.from([0, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0]);
  assert.equal(pickBackground(lightStrokes), "#111111");
  const darkStrokes = Uint8Array.from([0, 0, 0, 0, 20, 20, 20, 255, 255, 255, 255, 100]);
  assert.equal(pickBackground(darkStrokes), "#ffffff");
  assert.equal(pickBackground(Uint8Array.from([])), "#ffffff");
});

test("Tische werden nach Nummer sortiert, Namen dahinter", () => {
  const sorted = sortTablesById(
    ["10", "2", "VIP", "1", "Lounge", "11", " 3"].map((id) => ({ id }))
  ).map((t) => t.id);
  assert.deepEqual(sorted, ["1", "2", " 3", "10", "11", "Lounge", "VIP"]);
});

test("Erkannte Tische kommen sortiert zurück", () => {
  const tables = parseDetectedTables(
    '{"tables":[{"id":"12","x":1,"y":1,"w":5,"h":5},{"id":"3","x":20,"y":1,"w":5,"h":5},{"id":"1","x":40,"y":1,"w":5,"h":5}]}'
  );
  assert.deepEqual(tables.map((t) => t.id), ["1", "3", "12"]);
});
