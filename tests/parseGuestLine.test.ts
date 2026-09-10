import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGuestLine, parseGuestLines, countPeople, MAX_PARTY_SIZE } from "../src/lib/parseGuestLine";

test("Begleitung in allen gängigen Schreibweisen", () => {
  for (const line of ["Max Mustermann +2", "Max Mustermann+2", "Max Mustermann (+2)", "Max Mustermann plus 2", "Max Mustermann +2 Pers."]) {
    assert.deepEqual(parseGuestLine(line), { name: "Max Mustermann", partySize: 3 }, line);
  }
});

test("Ohne Zusatz eine Person; Plus mitten im Namen bleibt", () => {
  assert.deepEqual(parseGuestLine("Max Mustermann"), { name: "Max Mustermann", partySize: 1 });
  assert.deepEqual(parseGuestLine("Sam + The Band"), { name: "Sam + The Band", partySize: 1 });
});

test("Listenzeichen werden entfernt, Obergrenze greift", () => {
  assert.deepEqual(parseGuestLine("- Anna +1"), { name: "Anna", partySize: 2 });
  assert.deepEqual(parseGuestLine("3. Anna"), { name: "Anna", partySize: 1 });
  assert.equal(parseGuestLine("Anna +500").partySize, MAX_PARTY_SIZE);
});

test("Mehrzeilige Liste: Leerzeilen und Fragmente fallen raus, Personen werden summiert", () => {
  const entries = parseGuestLines("Anna +1\n\nB\nChris +2\n");
  assert.equal(entries.length, 2);
  assert.equal(countPeople(entries), 5);
});
