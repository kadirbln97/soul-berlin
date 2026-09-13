import { test } from "node:test";
import assert from "node:assert/strict";
import { safeInternalPath } from "../src/lib/safePath";

test("eigene Pfade bleiben erhalten", () => {
  assert.equal(safeInternalPath("/admin/events/abc", "/admin"), "/admin/events/abc");
  assert.equal(safeInternalPath("/admin?tab=2#x", "/admin"), "/admin?tab=2#x");
  assert.equal(safeInternalPath("/", "/admin"), "/");
});

test("fremde oder trickreiche Ziele fallen auf den Standard zurück", () => {
  for (const bad of [
    "https://boese.de",
    "http://boese.de/admin",
    "//boese.de",
    "/\\boese.de",
    "javascript:alert(1)",
    "/admin\\@boese.de",
    " /admin",
    "/admin\n",
    "",
    null,
    undefined
  ]) {
    assert.equal(safeInternalPath(bad, "/admin"), "/admin", `Eingabe: ${String(bad)}`);
  }
});
