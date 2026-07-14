import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/"), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Persona 5 Royal calendar shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
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
  assert.match(page, /TOKYO NAVIGATOR/);
  assert.match(page, /P5R_Tokyo_Subway_Map\.png/);
  assert.match(page, /P5R_Calendar_Dagger\.png/);
  assert.match(page, /function openMap/);
});
