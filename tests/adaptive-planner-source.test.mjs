import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the adaptive route-planning engine", async () => {
  const planner = await readFile(new URL("app/adaptive-planner.ts", root), "utf8");
  assert.match(planner, /deadlineRisks/);
  assert.match(planner, /availableAlternatives/);
  assert.match(planner, /recoveryPlan/);
  assert.match(planner, /encodeProfiles/);
  assert.match(planner, /decodeProfiles/);
});

test("connects missed activities and Route Intel to the calendar", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  const intel = await readFile(new URL("app/route-intel.tsx", root), "utf8");
  assert.match(page, /I MISSED THIS/);
  assert.match(page, /ROUTE RECALCULATED/);
  assert.match(page, /take-your-time-profiles-v1/);
  assert.match(intel, /OPEN-SLOT ALTERNATIVES/);
  assert.match(intel, /USE \+ OPEN MAP/);
  assert.match(intel, /STEAL YOUR SAVE/);
});

test("gates Futaba Nav behind her Palace and previews route consequences", async () => {
  const [page, intel, css] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/route-intel.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(page, /palaces\.includes\("Futaba"\)/);
  assert.match(page, /PHANTOM ROUTE ANALYSIS/);
  assert.match(page, /FUTABA NAV ONLINE/);
  assert.match(intel, /identity encrypted/);
  assert.match(page, /DAILY HEIST BRIEFING/);
  assert.match(page, /WHAT IF I SKIP\?/);
  assert.match(page, /No progress changes until you confirm/);
  assert.match(css, /futaba-decrypt/);
  assert.match(css, /consequence-preview/);
});
