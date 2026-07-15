"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { fetchLiveGuide, LIVE_GUIDE_URL, readCachedGuide, type GuideDay, type GuideTask } from "./live-guide";
import { confidants, findConfidant, findPlace, places, railLinks, type Confidant, type Place } from "./navigator";
import { schedule, type DayPlan, otherConfidants, royalTargets } from "./schedule";

type Slot = "afternoon" | "evening";
type Progress = Record<string, boolean>;

const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const GAME_START = new Date(2016, 3, 9);
const GAME_END = new Date(2017, 2, 20);
const EMPTY_TASKS: GuideTask[] = [];
const royalDeadlines = [
  { label: "MARUKI + AKECHI", date: gameDate(11, 17) },
  { label: "YOSHIZAWA", date: gameDate(12, 22) },
];
const yearPath = [
  ["APR", 4, 9], ["MAY", 5, 1], ["JUN", 6, 1], ["JUL", 7, 1], ["AUG", 8, 1], ["SEP", 9, 1],
  ["OCT", 10, 1], ["NOV", 11, 1], ["DEC", 12, 1], ["JAN", 1, 1], ["FEB", 2, 1], ["MAR", 3, 1],
] as const;

function keyFor(date: Date) { return `${date.getMonth() + 1}/${date.getDate()}`; }
function gameDate(month: number, day: number) { return new Date(month >= 4 ? 2016 : 2017, month - 1, day); }
function unlockDate(key: string) { const [month, day] = key.split("/").map(Number); return gameDate(month, day); }
function isPlaceUnlocked(place: Place, date: Date) { return date >= unlockDate(place.unlockAt); }
function label(date: Date) { return date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(); }
function inputDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function clampDate(date: Date) { return date < GAME_START ? GAME_START : date > GAME_END ? GAME_END : date; }

function planFor(date: Date): DayPlan {
  const exact = schedule[keyFor(date)];
  if (exact) return exact;
  return date.getMonth() <= 2
    ? { title: "Third Semester", afternoon: { title: "Team awakening / Faith", detail: "Prioritize unfinished third awakenings or Faith ranks.", type: "confidant" }, evening: { title: "Flexible evening", detail: "Use the slot for Jazz Club, training, or cleanup.", type: "free" } }
    : { title: "Live route guidance", afternoon: { title: "Loading optimal route", detail: "The live walkthrough will replace this fallback automatically.", type: "confidant" }, evening: { title: "Check the guide feed", detail: "Cached guidance remains available when offline.", type: "stat" } };
}

function DateCard({ date, selected, distance, motion, onSelect }: { date: Date; selected: boolean; distance: number; motion: "forward" | "backward"; onSelect: () => void }) {
  return <button className={`date-card ${selected ? "selected" : ""} ${date.getDay() === 0 ? "sunday" : ""}`} data-day={date.getDate()} style={{ "--distance": distance, "--slot": distance + 3 } as React.CSSProperties} onClick={onSelect} aria-label={`Select ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`} aria-current={selected ? "date" : undefined}>
    {selected && <span className="current-day-label" aria-hidden="true">CURRENT DAY</span>}
    {selected && <span className={`calendar-dagger ${motion}`} aria-hidden="true"><img src="/P5R_Calendar_Dagger.png?v=3" alt="" /></span>}
    <span className="day-number">{date.getDate()}</span><span className="weekday">{label(date)}</span>
  </button>;
}

function Activity({ slot, data, done, toggle }: { slot: Slot; data: DayPlan[Slot]; done: boolean; toggle: () => void }) {
  return <button className={`activity ${done ? "done" : ""}`} onClick={toggle}>
    <span className="checkbox" aria-hidden="true">{done ? "✓" : ""}</span>
    <span className="activity-copy"><small>{slot}</small><strong>{data.title}</strong><span>{data.detail}</span></span>
    <span className={`tag ${data.type}`}>{data.type}</span>
  </button>;
}

function LiveTask({ task, person, place, done, spoilerSafe, toggle, openRoute }: { task: GuideTask; person?: Confidant; place?: Place; done: boolean; spoilerSafe: boolean; toggle: () => void; openRoute?: () => void }) {
  return <article className={`live-task ${done ? "done" : ""}`}>
    <button className="task-check" onClick={toggle} aria-label={`${done ? "Uncheck" : "Complete"} ${task.title}`}><span className="checkbox" aria-hidden="true">{done ? "✓" : ""}</span></button>
    <button className="task-open" onClick={openRoute || toggle} aria-label={place ? `Show route to ${place.name} for ${task.title}` : task.title}>
      <span className="live-task-copy"><small>{task.section}</small>{person && <span className="person-name"><b>{person.name}</b><em>{person.arcana}</em></span>}<strong>{task.title}</strong>
      {task.details.length > 0 && <span className={`task-details ${spoilerSafe && task.answer ? "masked" : ""}`}>{spoilerSafe && task.answer ? `${task.details.length} optimal answer${task.details.length === 1 ? "" : "s"} hidden` : task.details.join("  ›  ")}</span>}
      </span>
    </button>
    <span className="task-action"><span className={`tag ${task.kind}`}>{task.kind}</span>{place && <button className="route-chip" onClick={openRoute}><b>R1</b>{place.name}<i>→</i></button>}</span>
  </article>;
}

export default function Home() {
  const [selected, setSelected] = useState(() => gameDate(4, 16));
  const [progress, setProgress] = useState<Progress>({});
  const [ranks, setRanks] = useState<Record<string, number>>({ Councillor: 0, Justice: 0, Faith: 0 });
  const [panel, setPanel] = useState<"plan" | "royal" | "map">("plan");
  const [guideDays, setGuideDays] = useState<GuideDay[]>([]);
  const [guideStatus, setGuideStatus] = useState<"loading" | "live" | "cached" | "offline">("loading");
  const [syncedAt, setSyncedAt] = useState("");
  const [query, setQuery] = useState("");
  const [spoilerSafe, setSpoilerSafe] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [motionKey, setMotionKey] = useState(0);
  const [dayMotion, setDayMotion] = useState<"forward" | "backward">("forward");
  const [selectedPlaceId, setSelectedPlaceId] = useState("shibuya");
  const [stationMenuOpen, setStationMenuOpen] = useState(false);
  const [morganaVisible, setMorganaVisible] = useState(false);
  const [morganaTaps, setMorganaTaps] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const cityLayer = useRef<HTMLDivElement>(null);
  const cityEcho = useRef<HTMLDivElement>(null);
  const plannerShell = useRef<HTMLElement>(null);
  const pointerFrame = useRef<number | null>(null);
  const pointerPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let active = true;
    async function hydrate() {
      await Promise.resolve();
      let hasCache = false;
      try {
        setProgress(JSON.parse(localStorage.getItem("take-your-time-progress") || "{}"));
        setRanks(JSON.parse(localStorage.getItem("take-your-time-ranks") || "{\"Councillor\":0,\"Justice\":0,\"Faith\":0}"));
        const savedDate = localStorage.getItem("take-your-time-current-day");
        if (savedDate) setSelected(clampDate(new Date(`${savedDate}T12:00:00`)));
        const cached = readCachedGuide();
        if (cached) {
          hasCache = true;
          setGuideDays(cached.days); setSyncedAt(cached.syncedAt); setGuideStatus("cached");
        }
      } catch { /* Safe defaults keep the planner usable. */ }
      try {
        const result = await fetchLiveGuide();
        if (active) { setGuideDays(result.days); setSyncedAt(result.syncedAt); setGuideStatus("live"); }
      } catch {
        if (active) setGuideStatus(hasCache ? "cached" : "offline");
      }
    }
    void hydrate();
    return () => {
      active = false;
      if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
    };
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    setMorganaVisible(hour >= 23 || hour < 5);
  }, []);

  async function refreshGuide() {
    setGuideStatus(current => current === "cached" ? "cached" : "loading");
    try {
      const result = await fetchLiveGuide();
      setGuideDays(result.days); setSyncedAt(result.syncedAt); setGuideStatus("live");
    } catch {
      setGuideStatus(current => current === "cached" ? "cached" : "offline");
    }
  }

  function chooseDate(date: Date) {
    const next = clampDate(date);
    if (next.getTime() !== selected.getTime()) {
      setDayMotion(next > selected ? "forward" : "backward");
      setMotionKey(value => value + 1);
    }
    setSelected(next); setPanel("plan");
    localStorage.setItem("take-your-time-current-day", inputDate(next));
  }

  function moveCity(event: React.PointerEvent<HTMLElement>) {
    pointerPosition.current = {
      x: (event.clientX / window.innerWidth - .5) * 2,
      y: (Math.min(event.clientY, window.innerHeight) / window.innerHeight - .4) * 2,
    };
    if (pointerFrame.current !== null) return;
    pointerFrame.current = requestAnimationFrame(() => {
      const { x, y } = pointerPosition.current;
      if (cityLayer.current) cityLayer.current.style.transform = `translate3d(${x * -7}px,${y * -4}px,0) scale(1.025)`;
      if (cityEcho.current) cityEcho.current.style.transform = `translate3d(${x * 16}px,${y * 9}px,0) scale(1.035)`;
      pointerFrame.current = null;
    });
  }

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + i - 3)), [selected]);
  const guideMap = useMemo(() => new Map(guideDays.map(day => [day.date, day])), [guideDays]);
  const dateKey = keyFor(selected);
  const liveDay = guideMap.get(dateKey);
  const plan = planFor(selected);
  const dayTasks = liveDay?.tasks || EMPTY_TASKS;
  const completed = useMemo(() => dayTasks.length ? dayTasks.reduce((sum, task, index) => sum + (progress[`${dateKey}:${task.section}:${index}`] ? 1 : 0), 0) : ["afternoon", "evening"].filter(slot => progress[`${dateKey}-${slot}`]).length, [dateKey, dayTasks, progress]);
  const totalTasks = useMemo(() => guideDays.reduce((sum, day) => sum + day.tasks.length, 0), [guideDays]);
  const totalDone = useMemo(() => Object.entries(progress).reduce((sum, [key, value]) => sum + (value && key.includes(":") ? 1 : 0), 0), [progress]);
  const taskSections = useMemo(() => {
    const sections = new Map<string, Array<{ task: GuideTask; index: number; person?: Confidant; place?: Place }>>();
    dayTasks.forEach((task, index) => {
      const section = sections.get(task.section);
      const item = { task, index, person: findConfidant(task), place: findPlace(task) };
      if (section) section.push(item);
      else sections.set(task.section, [item]);
    });
    return Array.from(sections.entries());
  }, [dayTasks]);
  const firstPerson = dayTasks[0] ? findConfidant(dayTasks[0]) : undefined;
  const todayPlace = useMemo(() => {
    for (const task of dayTasks) {
      const place = findPlace(task);
      if (place) return place;
    }
  }, [dayTasks]);
  const mapPlace = places.find(place => place.id === selectedPlaceId) ?? places[0]!;
  const unlockedPlaceIds = useMemo(() => new Set(places.filter(place => isPlaceUnlocked(place, selected)).map(place => place.id)), [selected]);
  const mapPlaceUnlocked = unlockedPlaceIds.has(mapPlace.id);
  const mapConfidants = confidants.filter(confidant => confidant.place === mapPlace.id);
  const statusTitle = firstPerson ? `${firstPerson.name} — ${dayTasks[0].title}` : dayTasks[0]?.title || plan.title;
  const taskTotal = dayTasks.length || 2;
  const daySecured = completed === taskTotal;
  const routeProgress = Math.round(((selected.getTime() - GAME_START.getTime()) / (GAME_END.getTime() - GAME_START.getTime())) * 100);
  const royalRadar = royalDeadlines.find(target => target.date >= selected) || { label: "THIRD SEMESTER", date: GAME_END };
  const daysToRoyal = Math.max(0, Math.ceil((royalRadar.date.getTime() - selected.getTime()) / 86400000));

  useEffect(() => {
    setSelectedPlaceId(current => {
      const currentPlace = places.find(place => place.id === current);
      if (currentPlace && isPlaceUnlocked(currentPlace, selected)) return current;
      return [...places].reverse().find(place => place.id !== "metaverse" && isPlaceUnlocked(place, selected))?.id ?? "yongen";
    });
  }, [selected]);

  const searchIndex = useMemo(() => guideDays.map(day => ({ day, text: `${day.date} ${day.tasks.map(task => `${task.section} ${task.title} ${task.details.join(" ")}`).join(" ")}`.toLowerCase() })), [guideDays]);
  const searchResults = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    if (!term) return [];
    return searchIndex.filter(entry => entry.text.includes(term)).slice(0, 9).map(entry => entry.day);
  }, [deferredQuery, searchIndex]);

  function toggle(id: string) {
    setProgress(current => {
      const next = { ...current, [id]: !current[id] };
      localStorage.setItem("take-your-time-progress", JSON.stringify(next));
      return next;
    });
  }

  function shiftMonth(delta: number) { chooseDate(new Date(selected.getFullYear(), selected.getMonth() + delta, selected.getDate())); }
  function selectKey(key: string) { const [month, day] = key.split("/").map(Number); chooseDate(gameDate(month, day)); setQuery(""); }

  function openMap(place: Place) {
    setSelectedPlaceId(place.id);
    setStationMenuOpen(false);
    setPanel("map");
    requestAnimationFrame(() => plannerShell.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function nextIncomplete() {
    if (!guideDays.length) return;
    const currentIndex = guideDays.findIndex(day => day.date === dateKey);
    const ordered = [...guideDays.slice(currentIndex + 1), ...guideDays.slice(0, Math.max(0, currentIndex + 1))];
    const next = ordered.find(day => day.tasks.some((task, index) => !progress[`${day.date}:${task.section}:${index}`]));
    if (next) selectKey(next.date);
  }

  function updateRank(name: string, delta: number) {
    setRanks(current => {
      const target = royalTargets.find(item => item.arcana === name)?.rank || 10;
      const next = { ...current, [name]: Math.max(0, Math.min(target, (current[name] || 0) + delta)) };
      localStorage.setItem("take-your-time-ranks", JSON.stringify(next));
      return next;
    });
  }

  return <main className={`${focusMode ? "focus-mode" : ""} ${daySecured ? "day-secured" : ""} motion-${dayMotion}`}>
    <section className="hero" aria-label="Persona 5 Royal calendar" onPointerMove={moveCity}>
      <div className="city-layer" ref={cityLayer} aria-hidden="true" />
      <div className="ink-noise" />
      <div className="city-echo" ref={cityEcho} aria-hidden="true" />
      <div className="ambient-shards" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <header className="masthead">
        <div className="brand"><span>TAKE YOUR</span><strong>TIME</strong><em>ROYAL</em></div>
        <div className="month-control" aria-label={`${monthNames[selected.getMonth()]} 20XX`}><span key={`month-${selected.getMonth()}`}><small>20XX</small>{monthNames[selected.getMonth()]}</span></div>
        <div className="mode-controls"><button className={`focus-button ${focusMode ? "active" : ""}`} onClick={() => setFocusMode(value => !value)}>{focusMode ? "OPEN PLAN" : "FOCUS HEIST"}</button><button className="map-button" onClick={() => setPanel(panel === "map" ? "plan" : "map")}>TOKYO MAP</button><button className="royal-button" onClick={() => setPanel(panel === "royal" ? "plan" : "royal")}>ROYAL CHECK</button></div>
      </header>
      <div className="date-track" key={`track-${motionKey}`}>{days.map((date, index) => <DateCard key={date.toISOString()} date={date} selected={index === 3} distance={index - 3} motion={dayMotion} onSelect={() => chooseDate(date)} />)}</div>
      <nav className="year-fold" aria-label="Jump through the game year"><span className="year-thread" style={{ "--route-progress": `${routeProgress}%` } as React.CSSProperties} />{yearPath.map(([name, month, day]) => <button key={name} className={selected.getMonth() === month - 1 ? "active" : ""} onClick={() => chooseDate(gameDate(month, day))} aria-label={`Jump to ${name}`}><i />{name}</button>)}</nav>
      <div className="status-strip" key={`status-${motionKey}`} aria-live="polite"><span>{selected.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span><strong>{daySecured ? "DAY SECURED" : statusTitle}</strong><span>{completed}/{taskTotal} DONE</span></div>
      {daySecured && <div className="secured-stamp" aria-live="polite"><b>MISSION</b><strong>SECURED</strong><span>TAKE YOUR TIME</span></div>}
    </section>

    <section className="planner-shell" ref={plannerShell}>
      <aside>
        <span className="section-kicker">PHANTOM LOG</span><strong className="completion">{totalDone}</strong><span className="tasks-cleared">OF {totalTasks || "—"} CLEARED</span>
        <div className="progress-line"><i style={{ width: `${totalTasks ? totalDone / totalTasks * 100 : 0}%` }} /></div>
        <div className="royal-radar" style={{ "--radar-pressure": `${Math.max(8, 100 - Math.min(daysToRoyal, 100))}%` } as React.CSSProperties}><div><i /><i /><i /></div><span>NEXT ROYAL LOCK</span><strong>{daysToRoyal}</strong><small>DAYS · {royalRadar.label}</small></div>
        <button className="next-mission" onClick={nextIncomplete} disabled={!guideDays.length}>NEXT OPEN DAY →</button>
        <div className={`sync-state ${guideStatus}`}><i />{guideStatus === "live" ? "LIVE GUIDE SYNCED" : guideStatus === "cached" ? "CACHED GUIDE" : guideStatus === "loading" ? "SYNCING GUIDE" : "OFFLINE FALLBACK"}</div>
        <p>Every checked action is saved on this device. The guide refreshes online and keeps its last complete copy for offline use.</p>
      </aside>

      {panel === "plan" ? <div className="day-plan" key={`plan-${dateKey}`}>
        <div className="guide-toolbar">
          <div className="search-wrap"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search Confidants, answers, dates…" aria-label="Search guide" />{searchResults.length > 0 && <div className="search-results">{searchResults.map(day => <button key={day.date} onClick={() => selectKey(day.date)}><b>{day.date}</b><span>{day.tasks[0]?.title || "Story day"}</span></button>)}</div>}</div>
          <input className="date-jump" type="date" min="2016-04-09" max="2017-03-20" value={inputDate(selected)} onChange={event => event.target.value && chooseDate(new Date(`${event.target.value}T12:00:00`))} aria-label="Jump to game date" />
          <button className={`spoiler-toggle ${spoilerSafe ? "safe" : ""}`} onClick={() => setSpoilerSafe(value => !value)}>{spoilerSafe ? "ANSWERS HIDDEN" : "ANSWERS SHOWN"}</button>
          <button className="refresh-guide" onClick={() => void refreshGuide()} aria-label="Refresh online guide">↻</button>
        </div>
        <div className="plan-heading"><span>MISSION FOR</span><h1>{monthNames[selected.getMonth()]} {selected.getDate()}</h1><p>{liveDay?.weekday || label(selected)}</p></div>
        {todayPlace && <button className="today-destination" onClick={() => openMap(todayPlace)}><span>GO HERE TODAY</span><strong>{todayPlace.name}</strong><small>{todayPlace.spots.join(" · ")}</small><b>OPEN ROUTE →</b></button>}
        {dayTasks.length > 0 ? <div className="live-sections">{taskSections.map(([section, tasks]) => <section className="guide-section" key={section}><h2>{section}</h2><div>{tasks.map(({ task, index, person, place }) => <LiveTask key={`${section}-${index}`} task={task} person={person} place={place} done={!!progress[`${dateKey}:${section}:${index}`]} spoilerSafe={spoilerSafe} toggle={() => toggle(`${dateKey}:${section}:${index}`)} openRoute={place ? () => openMap(place) : undefined} />)}</div></section>)}</div> : <div className="activities"><Activity slot="afternoon" data={plan.afternoon} done={!!progress[`${dateKey}-afternoon`]} toggle={() => toggle(`${dateKey}-afternoon`)} /><Activity slot="evening" data={plan.evening} done={!!progress[`${dateKey}-evening`]} toggle={() => toggle(`${dateKey}-evening`)} /></div>}
        <div className="source-row"><span>{syncedAt ? `Guide checked ${new Date(syncedAt).toLocaleDateString()}` : "Connecting to live guide…"}</span><a href={LIVE_GUIDE_URL} target="_blank" rel="noreferrer">Aqiu384 live schedule ↗</a><a href="https://gamefaqs.gamespot.com/ps4/260936-persona-5-royal/faqs/78629/walkthrough" target="_blank" rel="noreferrer">GameFAQs strategy ↗</a><a href="https://www.neoseeker.com/persona-5-royal/walkthrough" target="_blank" rel="noreferrer">Neoseeker cross-check ↗</a><a href="https://psnprofiles.com/guide/11946-persona-5-royal-100-perfect-schedule" target="_blank" rel="noreferrer">PSNProfiles perfect route ↗</a></div>
      </div> : panel === "royal" ? <div className="royal-panel">
        <div className="plan-heading"><span>THIRD SEMESTER</span><h1>ROYAL CHECK</h1><p>Deadlines are protected first.</p></div>
        <div className="targets">{royalTargets.map(target => { const value = ranks[target.arcana] || 0; return <div className="target" key={target.arcana}><div><small>{target.arcana}</small><strong>{target.name}</strong><span>Rank {target.rank} by {target.deadline}</span></div><div className="ranker"><button onClick={() => updateRank(target.arcana, -1)}>−</button><b>{value}</b><button onClick={() => updateRank(target.arcana, 1)}>+</button></div><i><b style={{ width: `${value / target.rank * 100}%` }} /></i></div>; })}</div>
        <div className="confidant-heading"><strong>ALL CONFIDANTS</strong><span>Track the rest of the Phantom Thieves&apos; network</span></div>
        <div className="confidant-grid">{otherConfidants.map(([arcana, name]) => <div className="mini-confidant" key={arcana}><span><small>{arcana}</small><b>{name}</b></span><span className="mini-ranker"><button onClick={() => updateRank(arcana, -1)}>−</button><b>{ranks[arcana] || 0}</b><button onClick={() => updateRank(arcana, 1)}>+</button></span></div>)}</div>
      </div> : <div className="map-panel">
        <div className="plan-heading"><span>R1 FAST TRAVEL</span><h1>TOKYO NAVIGATOR</h1><p>Choose a destination</p></div>
        <div className={`map-picker ${stationMenuOpen ? "open" : ""}`}>
          <button className="station-picker-trigger" type="button" aria-expanded={stationMenuOpen} aria-controls="station-roster" onClick={() => setStationMenuOpen(open => !open)}>
            <span className="station-command"><b>R1</b><small>SELECT STATION</small></span>
            <span className="station-current"><small>{mapPlaceUnlocked ? "DESTINATION AVAILABLE" : `LOCKED UNTIL ${mapPlace.unlockAt}`}</small><strong>{mapPlace.name}</strong><em>{mapPlace.spots.slice(0, 3).join(" · ")}</em></span>
            <span className="station-toggle" aria-hidden="true">{stationMenuOpen ? "CLOSE ×" : "CHANGE ▼"}</span>
          </button>
          {stationMenuOpen && <div className="station-roster" id="station-roster" role="listbox" aria-label="Tokyo destinations">{places.filter(place => place.id !== "metaverse").map((place, index) => { const unlocked = unlockedPlaceIds.has(place.id); return <button type="button" role="option" aria-selected={place.id === mapPlace.id} className={`${unlocked ? "available" : "locked"} ${place.id === mapPlace.id ? "active" : ""}`} style={{ "--station-index": index } as React.CSSProperties} key={place.id} onClick={() => { setSelectedPlaceId(place.id); setStationMenuOpen(false); }}><i /><span><strong>{place.name}</strong><small>{unlocked ? place.district : `REVEALS ${place.unlockAt}`}</small></span><b>{unlocked ? "GO" : "?"}</b></button>; })}</div>}
        </div>
        <div className="transit-layout">
          <div className="rail-map" aria-label="Adaptive Persona 5 Royal travel map">
            <svg className="adaptive-rail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <filter id="ink-reveal-edge" x="-15%" y="-15%" width="130%" height="130%">
                  <feTurbulence type="fractalNoise" baseFrequency=".045 .12" numOctaves="2" seed="17" result="inkNoise" />
                  <feDisplacementMap in="SourceGraphic" in2="inkNoise" scale="3.6" xChannelSelector="R" yChannelSelector="B" />
                  <feGaussianBlur stdDeviation=".55" />
                </filter>
                <mask id="progressive-map-reveal"><rect width="100" height="100" fill="black" /><g filter="url(#ink-reveal-edge)">{railLinks.map(link => { const from = places.find(place => place.id === link.from)!; const to = places.find(place => place.id === link.to)!; const open = unlockedPlaceIds.has(from.id) && unlockedPlaceIds.has(to.id); return open ? <line key={`${link.from}-${link.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="white" strokeWidth="7" strokeLinecap="round" /> : null; })}{places.filter(place => place.id !== "metaverse" && unlockedPlaceIds.has(place.id)).map(place => <circle key={place.id} cx={place.x} cy={place.y} r="7.5" fill="white" />)}</g></mask>
              </defs>
              <image className="map-image locked-map" href="/P5R_Tokyo_Subway_Map.png?v=3" width="100" height="100" preserveAspectRatio="none" />
              <image className="map-image revealed-map" href="/P5R_Tokyo_Subway_Map.png?v=3" width="100" height="100" preserveAspectRatio="none" mask="url(#progressive-map-reveal)" />
            </svg>
            <span className="map-scan" aria-hidden="true" />
            {places.filter(place => place.id !== "metaverse").map(place => { const unlocked = unlockedPlaceIds.has(place.id); return <button key={place.id} aria-label={`${unlocked ? "Route to" : "View unlock requirements for"} ${place.name}`} className={`map-node ${place.tone} ${unlocked ? "unlocked" : "locked"} ${mapPlace.id === place.id ? "active" : ""}`} style={{ "--map-x": `${place.x}%`, "--map-y": `${place.y}%` } as React.CSSProperties} onClick={() => setSelectedPlaceId(place.id)}><i /><span>{unlocked ? place.name : `? · ${place.unlockAt}`}</span></button>; })}
            <div className="map-legend"><span><i className="open" />AVAILABLE</span><span><i />NOT YET REVEALED</span></div>
          </div>
          <article className={`route-card ${mapPlaceUnlocked ? "available" : "locked"}`} key={`${mapPlace.id}-${mapPlaceUnlocked}`}><span className="route-kicker">{mapPlaceUnlocked ? "DESTINATION AVAILABLE" : "DESTINATION LOCKED"}</span><h2>{mapPlace.name}</h2><p>{mapPlace.district} · {mapPlace.line}</p><strong className="unlock-note">{mapPlace.unlock}</strong><ol>{mapPlace.route.map(step => <li key={step}>{step}</li>)}</ol><div className="spot-list">{mapPlace.spots.map(spot => <span key={spot}>{spot}</span>)}</div>{mapConfidants.length > 0 && <div className="people-here"><small>PEOPLE FOUND HERE</small>{mapConfidants.map(confidant => <div key={confidant.arcana}><b>{confidant.name}</b><span>{confidant.arcana} · {confidant.spot}</span></div>)}</div>}</article>
        </div>
        <p className="map-footnote"><b>{unlockedPlaceIds.size - 1} OF {places.length - 1} DESTINATIONS REVEALED FOR {monthNames[selected.getMonth()]} {selected.getDate()}.</b> Story districts appear automatically; book, invitation, and Confidant destinations follow the optimized guide route. The Yongen-Jaya ↔ Shibuya ↔ Aoyama-Itchome commuter-pass route is free.</p>
        <div className="map-sources"><span>UNLOCK RESEARCH</span><a href="https://aqiu384.github.io/megaten-database/p5r/overworld" target="_blank" rel="noreferrer">Megaten Database</a><a href="https://gamefaqs.gamespot.com/ps4/260936-persona-5-royal/faqs/78256" target="_blank" rel="noreferrer">GameFAQs route</a><a href="https://kamigame.jp/P5R/%E3%82%A8%E3%83%AA%E3%82%A2/index.html" target="_blank" rel="noreferrer">Kamigame unlock table</a></div>
      </div>}
    </section>
    <footer><strong>TAKE YOUR TIME.</strong><span>Live route • optimal answers • device-local progress</span></footer>
    {morganaVisible && <aside className="morgana-nudge" aria-live="polite"><button type="button" className="morgana-face" onClick={() => setMorganaTaps(taps => taps + 1)} aria-label="Ask Morgana for another hint"><i /><b>★</b></button><div><small>MORGANA SAYS</small><strong>{morganaTaps >= 4 ? "I'M NOT A CAT!" : morganaTaps >= 2 ? "Seriously. Tomorrow is another day." : "Shouldn't you be getting to sleep?"}</strong><span>Late-night guide detected.</span></div><button type="button" className="morgana-close" onClick={() => setMorganaVisible(false)} aria-label="Dismiss Morgana">×</button></aside>}
  </main>;
}
