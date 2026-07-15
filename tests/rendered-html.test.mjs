import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("server-renders the Persona 5 Royal calendar shell", async () => {
  const html = await readFile(new URL("../.next/server/app/index.html", import.meta.url), "utf8");
  assert.match(html, /Take Your Time/);
  assert.match(html, /Persona 5 Royal Calendar/);
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /P5_CityBackground\.png/);
});

test("ships live guidance, search, persistence, and Royal safeguards", async () => {
  const [page, guide, schedule, navigator] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/live-guide.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/schedule.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/navigator.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Search Confidants, answers, dates/);
  assert.match(page, /NEXT OPEN DAY/);
  assert.match(page, /localStorage\.setItem\("take-your-time-progress"/);
  assert.match(guide, /aqiu384\.github\.io\/megaten-database\/p5r\/ace-walkthrough/);
  assert.match(guide, /days\.length < 200/);
  assert.match(schedule, /NOV 17/);
  assert.match(schedule, /DEC 22/);
  assert.match(navigator, /Ryuji Sakamoto/);
  assert.match(navigator, /Takuto Maruki/);
  assert.match(navigator, /Press R1 to open the Rail Map/);
  assert.match(navigator, /unlockAt/);
  assert.match(navigator, /railLinks/);
  assert.match(page, /TOKYO NAVIGATOR/);
  assert.match(page, /station-roster/);
  assert.match(page, /SELECT STATION/);
  assert.match(page, /morgana-nudge/);
  assert.match(page, /velvet-curtain/);
  assert.match(page, /calling-card-complete/);
  assert.match(page, /approval-meter/);
  assert.match(page, /Adaptive Persona 5 Royal travel map/);
  assert.match(page, /P5R_Tokyo_Subway_Map\.png/);
  assert.match(page, /progressive-map-reveal/);
  assert.doesNotMatch(page, /day-wipe/);
  assert.match(page, /P5R_Calendar_Dagger\.png/);
  assert.match(page, /function openMap/);
});
