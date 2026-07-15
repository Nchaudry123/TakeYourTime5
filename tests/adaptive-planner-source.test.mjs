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
