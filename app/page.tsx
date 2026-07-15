"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { fetchLiveGuide, LIVE_GUIDE_URL, readCachedGuide, type GuideDay, type GuideTask } from "./live-guide";
import { confidants, findConfidant, findPlace, places, railLinks, type Confidant, type Place } from "./navigator";
import { schedule, type DayPlan, otherConfidants, royalTargets } from "./schedule";
import RouteIntel from "./route-intel";
import { availableAlternatives, createProfile, deadlineRisks, decodeProfiles, defaultSocialStats, encodeProfiles, normalizeProfile, recoveryPlan, type PlayerProfile, type SocialStatName, type SocialStats, type Weather } from "./adaptive-planner";

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
const characterMessages: Record<string, { name: string; initial: string; message: string }> = {
  "4/9": { name: "Morgana", initial: "M", message: "New city, new beginning. Take it one day at a time." },
  "4/18": { name: "Ryuji", initial: "R", message: "Today's the day. Let's get this plan moving!" },
  "6/5": { name: "Kasumi", initial: "K", message: "A new place can change your whole routine, senpai." },
  "7/9": { name: "Makoto", initial: "M", message: "Check the schedule twice. Preparation is our advantage." },
  "8/21": { name: "Futaba", initial: "F", message: "Calendar route optimized. Zero wasted turns!" },
  "10/30": { name: "Haru", initial: "H", message: "Even a busy day deserves a quiet cup of tea." },
  "11/17": { name: "Akechi", initial: "A", message: "Deadlines have a way of revealing one's priorities." },
  "12/24": { name: "Morgana", initial: "M", message: "Whatever happens, we made it here together." },
  "1/13": { name: "Kasumi", initial: "K", message: "Let's make every remaining day count." },
};
const valentineChoices = [
  "Ann Takamaki", "Makoto Niijima", "Futaba Sakura", "Haru Okumura", "Tae Takemi",
  "Sadayo Kawakami", "Chihaya Mifune", "Hifumi Togo", "Ichiko Ohya", "Sumire Yoshizawa",
  "Ryuji & Yusuke",
];
const INITIAL_PROFILE: PlayerProfile = { id: "default-route", name: "Joker's Route", progress: {}, missed: {}, ranks: Object.fromEntries([...royalTargets.map(target => target.arcana), ...otherConfidants.map(([arcana]) => arcana)].map(arcana => [arcana, 0])), stats: { ...defaultSocialStats }, palaces: [], money: 0, personas: [], weather: "Clear" };

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
    {selected && <span className={`calendar-dagger ${motion}`} aria-hidden="true"><Image src="/P5R_Calendar_Dagger.png" alt="" width={132} height={132} style={{ width: "100%", height: "100%" }} priority /></span>}
    <span className="day-number">{date.getDate()}</span><span className="weekday">{label(date)}</span>
  </button>;
}

function Activity({ slot, data, done, missed, toggle, markMissed }: { slot: Slot; data: DayPlan[Slot]; done: boolean; missed: boolean; toggle: () => void; markMissed: () => void }) {
  return <article className={`activity ${done ? "done" : ""} ${missed ? "missed" : ""}`}>
    <button type="button" className="activity-main" onClick={toggle}><span className="checkbox" aria-hidden="true">{done ? "✓" : ""}</span><span className="activity-copy"><small>{slot}</small><strong>{data.title}</strong><span>{data.detail}</span></span></button>
    <span className="activity-actions"><span className={`tag ${data.type}`}>{data.type}</span><button type="button" className="miss-task" onClick={markMissed}>{missed ? "UNDO MISS" : "I MISSED THIS"}</button></span>
  </article>;
}

function LiveTask({ task, person, place, done, missed, spoilerSafe, toggle, markMissed, openRoute }: { task: GuideTask; person?: Confidant; place?: Place; done: boolean; missed: boolean; spoilerSafe: boolean; toggle: () => void; markMissed: () => void; openRoute?: () => void }) {
  return <article className={`live-task ${done ? "done" : ""} ${missed ? "missed" : ""}`}>
    <button className="task-check" onClick={toggle} aria-label={`${done ? "Uncheck" : "Complete"} ${task.title}`}><span className="checkbox" aria-hidden="true">{done ? "✓" : ""}</span></button>
    <button className="task-open" onClick={openRoute || toggle} aria-label={place ? `Show route to ${place.name} for ${task.title}` : task.title}>
      <span className="live-task-copy"><small>{task.section}</small>{person && <span className="person-name"><b>{person.name}</b><em>{person.arcana}</em></span>}<strong>{task.title}</strong>
      {task.details.length > 0 && <span className={`task-details ${spoilerSafe && task.answer ? "masked" : ""}`}>{spoilerSafe && task.answer ? `${task.details.length} optimal answer${task.details.length === 1 ? "" : "s"} hidden` : task.details.join("  ›  ")}</span>}
      </span>
    </button>
    <span className="task-action"><span className={`tag ${task.kind}`}>{task.kind}</span>{place && <button className="route-chip" onClick={openRoute}><b>R1</b>{place.name}<i>→</i></button>}<button type="button" className="miss-task" onClick={markMissed}>{missed ? "UNDO MISS" : "I MISSED THIS"}</button></span>
  </article>;
}

export default function Home() {
  const [selected, setSelected] = useState(() => gameDate(4, 16));
  const [progress, setProgress] = useState<Progress>({});
  const [missed, setMissed] = useState<Progress>({});
  const [ranks, setRanks] = useState<Record<string, number>>({ Councillor: 0, Justice: 0, Faith: 0 });
  const [stats, setStats] = useState<SocialStats>({ ...defaultSocialStats });
  const [palaces, setPalaces] = useState<string[]>([]);
  const [money, setMoney] = useState(0);
  const [personas, setPersonas] = useState<string[]>([]);
  const [weather, setWeather] = useState<Weather>("Clear");
  const [profiles, setProfiles] = useState<PlayerProfile[]>([INITIAL_PROFILE]);
  const [activeProfileId, setActiveProfileId] = useState(INITIAL_PROFILE.id);
  const [profilesReady, setProfilesReady] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState("");
  const [recoveryFlash, setRecoveryFlash] = useState(false);
  const [panel, setPanel] = useState<"plan" | "royal" | "map" | "intel">("plan");
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
  const [velvetMode, setVelvetMode] = useState(false);
  const [phanFeedOpen, setPhanFeedOpen] = useState(false);
  const [monaRun, setMonaRun] = useState(false);
  const [denOpen, setDenOpen] = useState(false);
  const [slowTime, setSlowTime] = useState(false);
  const [burgerTakeover, setBurgerTakeover] = useState(false);
  const [valentine, setValentine] = useState("");
  const [callingTheme, setCallingTheme] = useState(false);
  const [dismissedMessage, setDismissedMessage] = useState("");
  const [callingCardVisible, setCallingCardVisible] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const cityLayer = useRef<HTMLDivElement>(null);
  const cityEcho = useRef<HTMLDivElement>(null);
  const plannerShell = useRef<HTMLElement>(null);
  const pointerFrame = useRef<number | null>(null);
  const velvetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callingCode = useRef("");
  const logoTapCount = useRef(0);
  const pointerPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let active = true;
    async function hydrate() {
      await Promise.resolve();
      let hasCache = false;
      try {
        const legacyProgress = JSON.parse(localStorage.getItem("take-your-time-progress") || "{}");
        const legacyRanks = JSON.parse(localStorage.getItem("take-your-time-ranks") || "{\"Councillor\":0,\"Justice\":0,\"Faith\":0}");
        const storedProfiles = JSON.parse(localStorage.getItem("take-your-time-profiles-v1") || "null");
        const loadedProfiles = Array.isArray(storedProfiles?.profiles) && storedProfiles.profiles.length
          ? storedProfiles.profiles.slice(0, 8).map((profile: Partial<PlayerProfile>, index: number) => normalizeProfile(profile, `Route ${index + 1}`))
          : [{ ...INITIAL_PROFILE, progress: legacyProgress, ranks: { ...INITIAL_PROFILE.ranks, ...legacyRanks } }];
        const loadedActiveId = loadedProfiles.some((profile: PlayerProfile) => profile.id === storedProfiles?.activeId) ? storedProfiles.activeId : loadedProfiles[0].id;
        const loadedActive = loadedProfiles.find((profile: PlayerProfile) => profile.id === loadedActiveId) || loadedProfiles[0];
        setProfiles(loadedProfiles); setActiveProfileId(loadedActiveId);
        setProgress(loadedActive.progress); setMissed(loadedActive.missed); setRanks({ ...INITIAL_PROFILE.ranks, ...loadedActive.ranks });
        setStats(loadedActive.stats); setPalaces(loadedActive.palaces); setMoney(loadedActive.money); setPersonas(loadedActive.personas); setWeather(loadedActive.weather);
        const savedDate = localStorage.getItem("take-your-time-current-day");
        if (savedDate) setSelected(clampDate(new Date(`${savedDate}T12:00:00`)));
        setValentine(localStorage.getItem("take-your-time-valentine") || "");
        const cached = readCachedGuide();
        if (cached) {
          hasCache = true;
          setGuideDays(cached.days); setSyncedAt(cached.syncedAt); setGuideStatus("cached");
        }
        setProfilesReady(true);
      } catch { setProfilesReady(true); /* Safe defaults keep the planner usable. */ }
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
    if (!profilesReady) return;
    const next = profiles.map(profile => profile.id === activeProfileId ? { ...profile, progress, missed, ranks, stats, palaces, money, personas, weather } : profile);
    localStorage.setItem("take-your-time-profiles-v1", JSON.stringify({ activeId: activeProfileId, profiles: next }));
  }, [profilesReady, profiles, activeProfileId, progress, missed, ranks, stats, palaces, money, personas, weather]);

  useEffect(() => {
    const hour = new Date().getHours();
    const timer = window.setTimeout(() => setMorganaVisible(hour >= 23 || hour < 5), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (panel !== "map") return;
    const firstRide = !sessionStorage.getItem("take-your-time-morganamobile-seen");
    if (!firstRide && Math.random() > .12) return;
    sessionStorage.setItem("take-your-time-morganamobile-seen", "1");
    const start = window.setTimeout(() => setMonaRun(true), 0);
    const timer = setTimeout(() => setMonaRun(false), 4400);
    return () => { clearTimeout(start); clearTimeout(timer); };
  }, [panel]);

  useEffect(() => {
    if (!slowTime) return;
    const timer = setTimeout(() => setSlowTime(false), 6500);
    return () => clearTimeout(timer);
  }, [slowTime]);

  useEffect(() => {
    function listenForCallingCard(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (!/^[a-z]$/i.test(event.key)) return;
      callingCode.current = `${callingCode.current}${event.key.toUpperCase()}`.slice(-20);
      if (callingCode.current.endsWith("TAKEYOURHEART")) {
        setCallingTheme(true);
        callingCode.current = "";
      }
    }
    window.addEventListener("keydown", listenForCallingCard);
    return () => window.removeEventListener("keydown", listenForCallingCard);
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
  const approval = totalTasks ? Math.min(100, Math.round(totalDone / totalTasks * 100)) : 0;
  const characterMessage = characterMessages[dateKey];
  const missedCount = Object.values(missed).filter(Boolean).length;
  const activeProfileBase = profiles.find(profile => profile.id === activeProfileId) || profiles[0] || INITIAL_PROFILE;
  const activeProfile = useMemo<PlayerProfile>(() => ({ ...activeProfileBase, progress, missed, ranks, stats, palaces, money, personas, weather }), [activeProfileBase, progress, missed, ranks, stats, palaces, money, personas, weather]);
  const routeRisks = useMemo(() => deadlineRisks(selected, ranks, guideDays), [selected, ranks, guideDays]);
  const overallRisk = routeRisks.some(risk => risk.status === "critical") ? "critical" : routeRisks.some(risk => risk.status === "tight") ? "tight" : "safe";
  const alternatives = useMemo(() => availableAlternatives(selected, weather, stats, money), [selected, weather, stats, money]);
  const recovery = useMemo(() => recoveryPlan(selected, guideDays, routeRisks, stats, ranks, personas, missedCount), [selected, guideDays, routeRisks, stats, ranks, personas, missedCount]);
  const exportCode = useMemo(() => typeof window === "undefined" ? "" : encodeProfiles(profiles.map(profile => profile.id === activeProfileId ? activeProfile : profile), activeProfileId), [profiles, activeProfileId, activeProfile]);

  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).has("bigbang");
    const timer = window.setTimeout(() => {
      setBurgerTakeover((dateKey === "5/6" && panel === "map") || preview);
      if (dateKey === "5/6" && panel === "map") setSelectedPlaceId("shibuya");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [dateKey, panel]);

  function chooseValentine(name: string) {
    setValentine(name);
    localStorage.setItem("take-your-time-valentine", name);
  }

  useEffect(() => {
    const start = window.setTimeout(() => setCallingCardVisible(daySecured), 0);
    if (!daySecured) return () => window.clearTimeout(start);
    const timer = window.setTimeout(() => setCallingCardVisible(false), 4200);
    return () => { window.clearTimeout(start); window.clearTimeout(timer); };
  }, [daySecured, dateKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSelectedPlaceId(current => {
        const currentPlace = places.find(place => place.id === current);
        if (currentPlace && isPlaceUnlocked(currentPlace, selected)) return current;
        return [...places].reverse().find(place => place.id !== "metaverse" && isPlaceUnlocked(place, selected))?.id ?? "yongen";
      }), 0);
    return () => window.clearTimeout(timer);
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
      if (next[id]) setMissed(currentMissed => ({ ...currentMissed, [id]: false }));
      return next;
    });
  }

  function markMissed(id: string) {
    setProgress(current => ({ ...current, [id]: false }));
    setMissed(current => ({ ...current, [id]: !current[id] }));
    setRecoveryFlash(true);
    window.setTimeout(() => setRecoveryFlash(false), 2600);
  }

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
      const next = { ...current, [name]: Math.max(0, Math.min(10, (current[name] || 0) + delta)) };
      localStorage.setItem("take-your-time-ranks", JSON.stringify(next));
      return next;
    });
  }

  function applyProfile(profile: PlayerProfile) {
    setActiveProfileId(profile.id); setProgress(profile.progress); setMissed(profile.missed); setRanks({ ...INITIAL_PROFILE.ranks, ...profile.ranks });
    setStats(profile.stats); setPalaces(profile.palaces); setMoney(profile.money); setPersonas(profile.personas); setWeather(profile.weather);
  }

  function selectProfile(id: string) {
    const profile = profiles.find(item => item.id === id);
    if (profile) {
      setProfiles(current => current.map(item => item.id === activeProfileId ? { ...item, progress, missed, ranks, stats, palaces, money, personas, weather } : item));
      applyProfile(profile);
    }
  }

  function createNewProfile() {
    const profile = createProfile(`New Game ${profiles.length + 1}`);
    setProfiles(current => [...current.map(item => item.id === activeProfileId ? { ...item, progress, missed, ranks, stats, palaces, money, personas, weather } : item), profile]);
    applyProfile(profile);
  }

  function deleteActiveProfile() {
    if (profiles.length <= 1) return;
    const remaining = profiles.filter(profile => profile.id !== activeProfileId);
    setProfiles(remaining);
    applyProfile(remaining[0]);
  }

  function renameActiveProfile(name: string) {
    setProfiles(current => current.map(profile => profile.id === activeProfileId ? { ...profile, name } : profile));
  }

  function updateStat(stat: SocialStatName, value: number) { setStats(current => ({ ...current, [stat]: Math.max(1, Math.min(5, value)) })); }
  function togglePalace(palace: string) { setPalaces(current => current.includes(palace) ? current.filter(item => item !== palace) : [...current, palace]); }
  function togglePersona(arcana: string) { setPersonas(current => current.includes(arcana) ? current.filter(item => item !== arcana) : [...current, arcana]); }
  function routeToPlace(placeId: string) { const place = places.find(item => item.id === placeId); if (place) openMap(place); }

  async function copyRouteCode() {
    try { await navigator.clipboard.writeText(exportCode); setImportError("Route code copied."); }
    catch { setImportError("Copy was blocked. Select the export code manually."); }
  }

  function importRoutes() {
    try {
      const imported = decodeProfiles(importCode);
      setProfiles(imported.profiles); setImportCode(""); setImportError("Routes imported successfully.");
      applyProfile(imported.profiles.find(profile => profile.id === imported.activeId) || imported.profiles[0]);
    } catch (error) { setImportError(error instanceof Error ? error.message : "This route code is not valid."); }
  }

  function beginVelvetHold() {
    if (velvetTimer.current) clearTimeout(velvetTimer.current);
    velvetTimer.current = setTimeout(() => setVelvetMode(true), 1800);
  }

  function endVelvetHold() {
    if (velvetTimer.current) clearTimeout(velvetTimer.current);
    velvetTimer.current = null;
  }

  return <main className={`${focusMode ? "focus-mode" : ""} ${daySecured ? "day-secured" : ""} ${velvetMode ? "velvet-mode" : ""} ${slowTime ? "slow-time" : ""} ${burgerTakeover ? "big-bang-day" : ""} ${callingTheme ? "calling-theme" : ""} motion-${dayMotion}`}>
    <section className="hero" aria-label="Persona 5 Royal calendar" onPointerMove={moveCity}>
      <div className="city-layer" ref={cityLayer} aria-hidden="true" />
      <div className="ink-noise" />
      <div className="city-echo" ref={cityEcho} aria-hidden="true" />
      <div className="ambient-shards" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <header className="masthead">
        <button type="button" className="brand" aria-label="Take Your Time" onClick={() => { logoTapCount.current += 1; if (logoTapCount.current >= 5) { setSlowTime(true); logoTapCount.current = 0; } }}><span>TAKE YOUR</span><strong>TIME</strong><em>ROYAL</em></button>
        <button className="month-control" type="button" aria-label={`${monthNames[selected.getMonth()]} 20XX. Hold to enter the Velvet Room.`} onPointerDown={beginVelvetHold} onPointerUp={endVelvetHold} onPointerLeave={endVelvetHold} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") beginVelvetHold(); }} onKeyUp={endVelvetHold}><span key={`month-${selected.getMonth()}`}><small>20XX</small>{monthNames[selected.getMonth()]}</span></button>
        <div className="mode-controls"><button className={`focus-button ${focusMode ? "active" : ""}`} onClick={() => setFocusMode(value => !value)}>{focusMode ? "OPEN PLAN" : "FOCUS HEIST"}</button><button className={`intel-button ${panel === "intel" ? "active" : ""}`} onClick={() => setPanel(panel === "intel" ? "plan" : "intel")}>ROUTE INTEL</button><button className="map-button" onClick={() => setPanel(panel === "map" ? "plan" : "map")}>TOKYO MAP</button><button className="royal-button" onClick={() => setPanel(panel === "royal" ? "plan" : "royal")}>ROYAL CHECK</button></div>
      </header>
      <div className="date-track" key={`track-${motionKey}`}>{days.map((date, index) => <DateCard key={date.toISOString()} date={date} selected={index === 3} distance={index - 3} motion={dayMotion} onSelect={() => chooseDate(date)} />)}</div>
      <nav className="year-fold" aria-label="Jump through the game year"><span className="year-thread" style={{ "--route-progress": `${routeProgress}%` } as React.CSSProperties} />{yearPath.map(([name, month, day]) => <button key={name} className={selected.getMonth() === month - 1 ? "active" : ""} onClick={() => chooseDate(gameDate(month, day))} aria-label={`Jump to ${name}`}><i />{name}</button>)}</nav>
      <div className="status-strip" key={`status-${motionKey}`} aria-live="polite"><span>{selected.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span><strong>{daySecured ? "DAY SECURED" : statusTitle}</strong><span>{completed}/{taskTotal} DONE</span></div>
      {characterMessage && dismissedMessage !== dateKey && <aside className="character-message" aria-live="polite"><span>{characterMessage.initial}</span><div><small>IM · {characterMessage.name}</small><strong>{characterMessage.message}</strong></div><button type="button" onClick={() => setDismissedMessage(dateKey)} aria-label={`Dismiss message from ${characterMessage.name}`}>×</button></aside>}
      {callingCardVisible && <div className="calling-card-complete" aria-live="polite"><small>MISSION REPORT:</small><strong>DAY<br />COMPLETE.</strong><span>ALL OBJECTIVES CLEARED</span><b>TAKE YOUR TIME.</b></div>}
    </section>

    <section className="planner-shell" ref={plannerShell}>
      <aside>
        <button type="button" className="section-kicker phan-site-trigger" onClick={() => setPhanFeedOpen(open => !open)} aria-expanded={phanFeedOpen}>PHANTOM LOG <small>PHAN-SITE ↗</small></button><strong className="completion">{totalDone}</strong><span className="tasks-cleared">OF {totalTasks || "—"} CLEARED</span>
        <div className="approval-meter"><span>PUBLIC APPROVAL</span><strong>{approval}%</strong><i><b style={{ width: `${approval}%` }} /></i></div>
        <button type="button" className={`adaptive-status ${overallRisk}`} onClick={() => setPanel("intel")}><span>FUTABA ROUTE SCAN</span><strong>{overallRisk === "safe" ? "ON TRACK" : overallRisk === "tight" ? "TIGHT" : "AT RISK"}</strong><small>{missedCount ? `${missedCount} MISSED · OPEN RECOVERY` : `${activeProfile.name} · OPEN INTEL`}</small></button>
        {phanFeedOpen && <div className="phan-feed" aria-live="polite"><span>PHANTOM AFICIONADO</span><p><b>NEW</b> Is the optimal route actually real?</p><p><b>HOT</b> They never waste an afternoon.</p><p><b>{approval >= 50 ? "BELIEVE" : "???"}</b> Approval is at {approval}%. Keep watching.</p></div>}
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
        {dateKey === "2/14" && <section className="valentine-event" aria-label="Choose your Valentine"><header><small>FEBRUARY 14 · SPECIAL EVENT</small><h2>{valentine ? "VALENTINE LOCKED IN" : "WHO HAS YOUR HEART?"}</h2><p>{valentine ? `Tonight belongs to ${valentine}. Your choice is saved for this playthrough.` : "Choose who Joker will spend Valentine's evening with."}</p></header><div>{valentineChoices.map(name => <button type="button" className={valentine === name ? "chosen" : ""} onClick={() => chooseValentine(name)} key={name}><i>{name === "Ryuji & Yusuke" ? "★" : "♥"}</i><span><strong>{name}</strong><small>{name === "Ryuji & Yusuke" ? "FRIENDSHIP ROUTE" : "VALENTINE DATE"}</small></span><b>{valentine === name ? "CHOSEN" : "CHOOSE"}</b></button>)}</div></section>}
        {todayPlace && <button className="today-destination" onClick={() => openMap(todayPlace)}><span>GO HERE TODAY</span><strong>{todayPlace.name}</strong><small>{todayPlace.spots.join(" · ")}</small><b>OPEN ROUTE →</b></button>}
        {dayTasks.length > 0 ? <div className="live-sections">{taskSections.map(([section, tasks]) => <section className="guide-section" key={section}><h2>{section}</h2><div>{tasks.map(({ task, index, person, place }) => { const taskId = `${dateKey}:${section}:${index}`; return <LiveTask key={`${section}-${index}`} task={task} person={person} place={place} done={!!progress[taskId]} missed={!!missed[taskId]} spoilerSafe={spoilerSafe} toggle={() => toggle(taskId)} markMissed={() => markMissed(taskId)} openRoute={place ? () => openMap(place) : undefined} />; })}</div></section>)}</div> : <div className="activities"><Activity slot="afternoon" data={plan.afternoon} done={!!progress[`${dateKey}-afternoon`]} missed={!!missed[`${dateKey}-afternoon`]} toggle={() => toggle(`${dateKey}-afternoon`)} markMissed={() => markMissed(`${dateKey}-afternoon`)} /><Activity slot="evening" data={plan.evening} done={!!progress[`${dateKey}-evening`]} missed={!!missed[`${dateKey}-evening`]} toggle={() => toggle(`${dateKey}-evening`)} markMissed={() => markMissed(`${dateKey}-evening`)} /></div>}
        <div className="source-row"><span>{syncedAt ? `Guide checked ${new Date(syncedAt).toLocaleDateString()}` : "Connecting to live guide…"}</span><a href={LIVE_GUIDE_URL} target="_blank" rel="noreferrer">Aqiu384 live schedule ↗</a><a href="https://gamefaqs.gamespot.com/ps4/260936-persona-5-royal/faqs/78629/walkthrough" target="_blank" rel="noreferrer">GameFAQs strategy ↗</a><a href="https://www.neoseeker.com/persona-5-royal/walkthrough" target="_blank" rel="noreferrer">Neoseeker cross-check ↗</a><a href="https://psnprofiles.com/guide/11946-persona-5-royal-100-perfect-schedule" target="_blank" rel="noreferrer">PSNProfiles perfect route ↗</a></div>
      </div> : panel === "intel" ? <RouteIntel profile={activeProfile} profiles={profiles} activeId={activeProfileId} risks={routeRisks} alternatives={alternatives} recovery={recovery} missedCount={missedCount} exportCode={exportCode} importCode={importCode} importError={importError} onSelectProfile={selectProfile} onCreateProfile={createNewProfile} onDeleteProfile={deleteActiveProfile} onRenameProfile={renameActiveProfile} onStat={updateStat} onRank={updateRank} onMoney={value => setMoney(Math.max(0, value || 0))} onWeather={setWeather} onPalace={togglePalace} onPersona={togglePersona} onRoute={routeToPlace} onCopy={() => void copyRouteCode()} onImportCode={setImportCode} onImport={importRoutes} /> : panel === "royal" ? <div className="royal-panel">
        <div className="plan-heading"><span>THIRD SEMESTER</span><h1>ROYAL CHECK</h1><p>Deadlines are protected first.</p></div>
        <div className="targets">{royalTargets.map(target => { const value = ranks[target.arcana] || 0; return <div className="target" key={target.arcana}><div><small>{target.arcana}</small><strong>{target.name}</strong><span>Rank {target.rank} by {target.deadline}</span></div><div className="ranker"><button onClick={() => updateRank(target.arcana, -1)}>−</button><b>{value}</b><button onClick={() => updateRank(target.arcana, 1)}>+</button></div><i><b style={{ width: `${value / target.rank * 100}%` }} /></i></div>; })}</div>
        <div className="confidant-heading"><strong>ALL CONFIDANTS</strong><span>Track the rest of the Phantom Thieves&apos; network</span></div>
        <div className="confidant-grid">{otherConfidants.map(([arcana, name]) => <div className="mini-confidant" key={arcana}><span><small>{arcana}</small><b>{name}</b></span><span className="mini-ranker"><button onClick={() => updateRank(arcana, -1)}>−</button><b>{ranks[arcana] || 0}</b><button onClick={() => updateRank(arcana, 1)}>+</button></span></div>)}</div>
      </div> : <div className="map-panel">
        <div className="plan-heading"><span>R1 FAST TRAVEL</span><h1>TOKYO NAVIGATOR</h1><p>Choose a destination</p></div>
        <div className={`map-picker ${stationMenuOpen ? "open" : ""}`}>
          <button className="station-picker-trigger" type="button" aria-expanded={stationMenuOpen} aria-controls="station-roster" onClick={() => setStationMenuOpen(open => !open)}>
            <span className="station-command"><b>R1</b><small>SELECT STATION</small></span>
            <span className="station-current"><small>{burgerTakeover ? "MAY 6 CHALLENGE UNLOCKED" : mapPlaceUnlocked ? "DESTINATION AVAILABLE" : `LOCKED UNTIL ${mapPlace.unlockAt}`}</small><strong>{burgerTakeover ? "Big Bang Burger" : mapPlace.name}</strong><em>{burgerTakeover ? "The challenge is now open in Shibuya" : mapPlace.spots.slice(0, 3).join(" · ")}</em></span>
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
            {monaRun && <span className="morganamobile" aria-hidden="true"><i /><b>M</b><em>★</em></span>}
            {places.filter(place => place.id !== "metaverse").map(place => { const unlocked = unlockedPlaceIds.has(place.id); return <button key={place.id} aria-label={`${unlocked ? "Route to" : "View unlock requirements for"} ${place.name}`} className={`map-node ${place.tone} ${unlocked ? "unlocked" : "locked"} ${mapPlace.id === place.id ? "active" : ""}`} style={{ "--map-x": `${place.x}%`, "--map-y": `${place.y}%` } as React.CSSProperties} onClick={() => setSelectedPlaceId(place.id)}><i /><span>{unlocked ? place.name : `? · ${place.unlockAt}`}</span></button>; })}
            <div className="map-legend"><span><i className="open" />AVAILABLE</span><span><i />NOT YET REVEALED</span></div>
          </div>
          <article className={`route-card ${mapPlaceUnlocked ? "available" : "locked"}`} key={`${mapPlace.id}-${mapPlaceUnlocked}`}><span className="route-kicker">{burgerTakeover ? "COSMIC FOOD CHALLENGE" : mapPlaceUnlocked ? "DESTINATION AVAILABLE" : "DESTINATION LOCKED"}</span><h2>{burgerTakeover ? "Big Bang Burger" : mapPlace.name}</h2><p>{mapPlace.district} · {mapPlace.line}</p><strong className="unlock-note">{burgerTakeover ? "CHALLENGE AVAILABLE FROM TODAY" : mapPlace.unlock}</strong><ol>{mapPlace.route.map(step => <li key={step}>{step}</li>)}</ol><div className="spot-list">{mapPlace.spots.map(spot => <span key={spot}>{spot}</span>)}</div>{mapConfidants.length > 0 && <div className="people-here"><small>PEOPLE FOUND HERE</small>{mapConfidants.map(confidant => <div key={confidant.arcana}><b>{confidant.name}</b><span>{confidant.arcana} · {confidant.spot}</span></div>)}</div>}</article>
        </div>
        <p className="map-footnote"><b>{unlockedPlaceIds.size - 1} OF {places.length - 1} DESTINATIONS REVEALED FOR {monthNames[selected.getMonth()]} {selected.getDate()}.</b> Story districts appear automatically; book, invitation, and Confidant destinations follow the optimized guide route. The Yongen-Jaya ↔ Shibuya ↔ Aoyama-Itchome commuter-pass route is free.</p>
        <div className="map-sources"><span>UNLOCK RESEARCH</span><a href="https://aqiu384.github.io/megaten-database/p5r/overworld" target="_blank" rel="noreferrer">Megaten Database</a><a href="https://gamefaqs.gamespot.com/ps4/260936-persona-5-royal/faqs/78256" target="_blank" rel="noreferrer">GameFAQs route</a><a href="https://kamigame.jp/P5R/%E3%82%A8%E3%83%AA%E3%82%A2/index.html" target="_blank" rel="noreferrer">Kamigame unlock table</a></div>
      </div>}
    </section>
    <footer><strong>TAKE YOUR TIME.</strong><button type="button" className="den-trigger" onClick={() => setDenOpen(true)}>THIEVES DEN <b>{totalDone >= 25 ? "OPEN" : "LOCKED"}</b></button><span>Live route • optimal answers • device-local progress</span></footer>
    {morganaVisible && <aside className="morgana-nudge" aria-live="polite"><button type="button" className="morgana-face" onClick={() => setMorganaTaps(taps => taps + 1)} aria-label="Ask Morgana for another hint"><i /><b>★</b></button><div><small>MORGANA SAYS</small><strong>{morganaTaps >= 4 ? "I'M NOT A CAT!" : morganaTaps >= 2 ? "Seriously. Tomorrow is another day." : "Shouldn't you be getting to sleep?"}</strong><span>Late-night guide detected.</span></div><button type="button" className="morgana-close" onClick={() => setMorganaVisible(false)} aria-label="Dismiss Morgana">×</button></aside>}
    {velvetMode && <button type="button" className="velvet-curtain" onClick={() => setVelvetMode(false)} aria-label="Leave the Velvet Room"><span className="velvet-chain left" /><span className="velvet-chain right" /><span><small>THE VELVET ROOM</small><strong>WELCOME, INMATE</strong><em>Your rehabilitation continues.</em><b>TOUCH ANYWHERE TO RETURN</b></span></button>}
    {denOpen && <section className="thieves-den" role="dialog" aria-modal="true" aria-label="Thieves Den gallery"><button type="button" className="den-close" onClick={() => setDenOpen(false)}>CLOSE ×</button><header><small>SECRET ARCHIVE</small><h2>THIEVES DEN</h2><p>Your playthrough leaves evidence behind.</p></header><div className="den-stats"><span><b>{totalDone}</b>ACTIONS CLEARED</span><span><b>{approval}%</b>APPROVAL</span><span><b>{Object.values(ranks).filter(rank => rank >= 10).length}</b>MAX BONDS</span></div><div className="den-gallery"><article className={totalDone >= 25 ? "unlocked" : "locked"}><i>01</i><strong>FIRST CALLING CARD</strong><span>{totalDone >= 25 ? "25 actions completed" : `${Math.max(0, 25 - totalDone)} actions remain`}</span></article><article className={totalDone >= 100 ? "unlocked" : "locked"}><i>02</i><strong>PHAN-SITE DARLING</strong><span>{totalDone >= 100 ? "100 actions completed" : `${Math.max(0, 100 - totalDone)} actions remain`}</span></article><article className={totalDone >= 250 ? "unlocked" : "locked"}><i>03</i><strong>TAKE YOUR TIME</strong><span>{totalDone >= 250 ? "250 actions completed" : `${Math.max(0, 250 - totalDone)} actions remain`}</span></article></div></section>}
    {slowTime && <div className="slow-time-notice" aria-live="polite"><small>TIME DISTORTION</small><strong>TAKE YOUR TIME.</strong></div>}
    {recoveryFlash && <div className="recovery-flash" aria-live="polite"><small>FUTABA NAV</small><strong>ROUTE RECALCULATED</strong><span>RECOVERY OPTIONS UPDATED</span></div>}
    {burgerTakeover && <div className="big-bang-banner" aria-live="polite"><small>MAY 6 UNLOCK</small><strong>BIG BANG CHALLENGE!</strong><span>NOW OPEN IN SHIBUYA.</span></div>}
    {callingTheme && <button type="button" className="calling-code-banner" onClick={() => setCallingTheme(false)} aria-label="Dismiss calling card theme"><small>CODE ACCEPTED</small><strong>TAKE YOUR HEART</strong><span>THE PHANTOM THEME HAS BEEN UNLOCKED</span><b>×</b></button>}
  </main>;
}
