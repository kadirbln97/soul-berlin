import { test } from "node:test";
import assert from "node:assert/strict";
import { renderText } from "../src/lib/renderText";
import { safeJsonLd } from "../src/lib/structuredData";

// Regressionstests gegen eingeschleusten Code (XSS) an den beiden Stellen,
// an denen die Seite HTML nicht über React, sondern direkt schreibt.

test("renderText: HTML aus dem Baukasten wird zu sichtbarem Text", () => {
  const html = renderText('<script>alert(1)</script> <img src=x onerror=alert(1)>');
  assert.ok(!html.includes("<script"));
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("renderText: nur harmlose Linkziele werden verlinkt", () => {
  assert.ok(renderText("[ok](https://soulberlin.de)").includes('href="https://soulberlin.de"'));
  assert.ok(renderText("[ok](mailto:hi@soulberlin.de)").includes('href="mailto:'));
  assert.ok(!renderText("[böse](javascript:alert(1))").includes("href="));
  assert.ok(!renderText("[böse](data:text/html,x)").includes("href="));
});

test("renderText: Anführungszeichen können Attribute nicht verlassen", () => {
  const html = renderText('[x](https://a.de/"onmouseover="alert(1))');
  // Das " ist escaped, das Attribut endet also nicht vorzeitig.
  assert.ok(!html.includes('"onmouseover='));
  assert.ok(!/href="[^"]*"onmouseover/.test(html));
});

test("renderText: externe Links bekommen rel=noopener", () => {
  const html = renderText("[x](https://example.com)");
  assert.ok(html.includes('rel="noreferrer noopener"'));
  assert.ok(html.includes('target="_blank"'));
});

test("safeJsonLd: </script> kann das Skript-Tag nicht beenden", () => {
  const out = safeJsonLd({ name: 'Party </script><script>alert(1)</script>', amp: "a&b" });
  assert.ok(!out.includes("</script>"));
  assert.ok(!out.includes("<"));
  assert.ok(!out.includes("&"));
  // Bleibt gültiges JSON mit identischem Inhalt.
  assert.deepEqual(JSON.parse(out), {
    name: "Party </script><script>alert(1)</script>",
    amp: "a&b"
  });
});
