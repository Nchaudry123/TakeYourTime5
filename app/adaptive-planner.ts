import type { GuideDay, GuideKind } from "./live-guide";

export const socialStatNames = ["Knowledge", "Guts", "Proficiency", "Kindness", "Charm"] as const;
export type SocialStatName = typeof socialStatNames[number];
export type SocialStats = Record<SocialStatName, number>;
export type Weather = "Clear" | "Rain" | "Pollen" | "Heat Wave" | "Flu Season";

export type PlayerProfile = {
  id: string;
  name: string;
  progress: Record<string, boolean>;
  missed: Record<string, boolean>;
  ranks: Record<string, number>;
  stats: SocialStats;
  palaces: string[];
  money: number;
  personas: string[];
  weather: Weather;
};

export type DeadlineRisk = {
  arcana: string;
  name: string;
  current: number;
  target: number;
  deadline: string;
  meetings: number;
  status: "safe" | "tight" | "critical";
  message: string;
};

export type Alternative = {
  id: string;
  title: string;
  detail: string;
  gain: string;
  placeId: string;
  slot: "Afternoon" | "Evening" | "Either";
  cost: number;
  available: boolean;
  reason: string;
};

export type RecoveryAction = {
  date: string;
  title: string;
  detail: string;
  kind: GuideKind;
  placeId: string;
  reason: string;
};

export const defaultSocialStats: SocialStats = { Knowledge: 1, Guts: 1, Proficiency: 1, Kindness: 1, Charm: 1 };
export const palaceNames = ["Kamoshida", "Madarame", "Kaneshiro", "Futaba", "Okumura", "Sae", "Shido", "Mementos", "Maruki"];
export const personaArcanas = ["Chariot", "Lovers", "Death", "Temperance", "Fortune", "Emperor", "Priestess", "Hermit", "Empress", "Hierophant", "Star", "Hanged Man", "Tower", "Devil", "Sun", "Moon", "Councillor", "Justice", "Faith"];

const targetData = [
  { arcana: "Councillor", name: "Takuto Maruki", short: "Maruki", target: 9, deadline: "11/17" },
  { arcana: "Justice", name: "Goro Akechi", short: "Akechi", target: 8, deadline: "11/17" },
  { arcana: "Faith", name: "Kasumi Yoshizawa", short: "Kasumi", target: 5, deadline: "12/22" },
] as const;

function gameDate(key: string) {
  const [month, day] = key.split("/").map(Number);
  return new Date(month >= 4 ? 2016 : 2017, month - 1, day);
}

function taskText(day: GuideDay) {
  return day.tasks.map(task => `${task.title} ${task.details.join(" ")}`).join(" ").toLowerCase();
}

export function createProfile(name = "Joker's Route"): PlayerProfile {
  return {
    id: `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    progress: {},
    missed: {},
    ranks: Object.fromEntries(personaArcanas.map(arcana => [arcana, 0])),
    stats: { ...defaultSocialStats },
    palaces: [],
    money: 0,
    personas: [],
    weather: "Clear",
  };
}

export function normalizeProfile(value: Partial<PlayerProfile>, fallbackName = "Joker's Route"): PlayerProfile {
  const base = createProfile(fallbackName);
  return {
    ...base,
    ...value,
    id: typeof value.id === "string" ? value.id : base.id,
    name: typeof value.name === "string" ? value.name.slice(0, 32) : fallbackName,
    progress: value.progress && typeof value.progress === "object" ? value.progress : {},
    missed: value.missed && typeof value.missed === "object" ? value.missed : {},
    ranks: value.ranks && typeof value.ranks === "object" ? { ...base.ranks, ...value.ranks } : base.ranks,
    stats: { ...defaultSocialStats, ...(value.stats || {}) },
    palaces: Array.isArray(value.palaces) ? value.palaces.filter(item => palaceNames.includes(item)) : [],
    personas: Array.isArray(value.personas) ? value.personas.filter(item => personaArcanas.includes(item)) : [],
    money: Number.isFinite(value.money) ? Math.max(0, Number(value.money)) : 0,
    weather: (["Clear", "Rain", "Pollen", "Heat Wave", "Flu Season"] as string[]).includes(value.weather || "") ? value.weather as Weather : "Clear",
  };
}

export function deadlineRisks(selected: Date, ranks: Record<string, number>, guideDays: GuideDay[]): DeadlineRisk[] {
  return targetData.map(target => {
    const current = ranks[target.arcana] || 0;
    const gap = Math.max(0, target.target - current);
    const deadline = gameDate(target.deadline);
    const meetings = guideDays.filter(day => {
      const date = gameDate(day.date);
      if (date < selected || date > deadline) return false;
      const text = taskText(day);
      return text.includes(target.short.toLowerCase()) || text.includes(target.arcana.toLowerCase());
    }).length;
    const status = gap === 0 ? "safe" : selected > deadline || meetings < gap ? "critical" : meetings - gap <= 1 ? "tight" : "safe";
    const message = gap === 0
      ? "Target secured."
      : status === "critical"
        ? `${gap} rank${gap === 1 ? "" : "s"} needed with ${meetings} guided opening${meetings === 1 ? "" : "s"} left.`
        : `${gap} rank${gap === 1 ? "" : "s"} needed; ${meetings} guided openings remain.`;
    return { ...target, current, meetings, status, message };
  });
}

export function availableAlternatives(selected: Date, weather: Weather, stats: SocialStats, money: number): Alternative[] {
  const weekday = selected.getDay();
  const afterMaySix = selected >= gameDate("5/6");
  const afterJune = selected >= gameDate("6/23");
  const rain = weather === "Rain";
  return [
    { id: "diner", title: "Study at the Diner", detail: rain ? "Rainy-day focus improves the Knowledge return." : "A reliable Knowledge fallback with an extra food bonus.", gain: rain ? "Knowledge ++" : "Knowledge +", placeId: "shibuya", slot: "Afternoon", cost: 700, available: money >= 700, reason: money >= 700 ? "Available on Central Street." : "Requires ¥700." },
    { id: "bathhouse", title: "Visit the Bathhouse", detail: weekday === 1 || weekday === 4 ? "Monday and Thursday medicinal bath bonus is active." : "Raise Charm without needing a Confidant opening.", gain: weekday === 1 || weekday === 4 ? "Charm ++" : "Charm +", placeId: "yongen", slot: "Evening", cost: 500, available: money >= 500, reason: money >= 500 ? "Available this evening." : "Requires ¥500." },
    { id: "burger", title: "Big Bang Challenge", detail: "Convert an open slot into Guts and multi-stat progress.", gain: "Guts +", placeId: "shibuya", slot: "Either", cost: 500, available: afterMaySix && money >= 500, reason: !afterMaySix ? "Unlocks May 6." : money < 500 ? "Requires at least ¥500." : "Challenge is open." },
    { id: "craft", title: "Craft Infiltration Tools", detail: "Build lockpicks and raise Proficiency at Leblanc.", gain: "Proficiency +", placeId: "yongen", slot: "Evening", cost: 0, available: true, reason: "Always available on a free Leblanc evening." },
    { id: "flower", title: "Work at the Flower Shop", detail: "Earn money while building Kindness.", gain: "Kindness + · ¥", placeId: "shibuya", slot: "Either", cost: 0, available: stats.Charm >= 2, reason: stats.Charm >= 2 ? "Charm requirement met." : "Requires Charm Rank 2." },
    { id: "crossroads", title: "Work at Crossroads", detail: "Use a late-game evening to earn money and Social Stat progress.", gain: "Stat + · ¥", placeId: "shinjuku", slot: "Evening", cost: 0, available: afterJune && stats.Kindness >= 3, reason: !afterJune ? "Unlocks after Shinjuku opens." : stats.Kindness < 3 ? "Requires Kindness Rank 3." : "Available this evening." },
  ];
}

function placeFor(text: string) {
  const lower = text.toLowerCase();
  if (/maruki|school|shujin/.test(lower)) return "aoyama";
  if (/akechi|darts|billiards|jazz|kichijoji/.test(lower)) return "kichijoji";
  if (/kasumi|faith/.test(lower)) return "kichijoji";
  if (/takemi|clinic|leblanc|sojiro/.test(lower)) return "yongen";
  if (/shinjuku|ohya|chihaya|crossroads/.test(lower)) return "shinjuku";
  if (/akihabara|shinya/.test(lower)) return "akihabara";
  return "shibuya";
}

export function recoveryPlan(selected: Date, guideDays: GuideDay[], risks: DeadlineRisk[], stats: SocialStats, ranks: Record<string, number>, personas: string[] = [], missedCount = 0): RecoveryAction[] {
  const result: RecoveryAction[] = [];
  const urgent = risks.filter(risk => risk.status !== "safe");
  for (const risk of urgent) {
    const next = guideDays.find(day => gameDate(day.date) >= selected && gameDate(day.date) <= gameDate(risk.deadline) && taskText(day).includes(risk.name.split(" ").at(-1)!.toLowerCase()));
    const personaNote = personas.includes(risk.arcana) ? `${risk.arcana} Persona ready.` : `Bring a ${risk.arcana} Persona.`;
    result.push({ date: next?.date || risk.deadline, title: `${risk.arcana} recovery`, detail: next?.tasks.find(task => `${task.title} ${task.details.join(" ")}`.toLowerCase().includes(risk.name.split(" ").at(-1)!.toLowerCase()))?.title || `Prioritize ${risk.name} at the next opening.`, kind: "confidant", placeId: risk.arcana === "Councillor" ? "aoyama" : "kichijoji", reason: `${risk.status.toUpperCase()} · ${risk.message} ${personaNote}` });
  }
  const lowestStat = socialStatNames.reduce((lowest, stat) => stats[stat] < stats[lowest] ? stat : lowest, socialStatNames[0]);
  const future = guideDays.filter(day => gameDate(day.date) >= selected).slice(0, 45);
  for (const day of future) {
    for (const task of day.tasks) {
      if (result.length >= 5) break;
      const combined = `${task.title} ${task.details.join(" ")}`;
      const lower = combined.toLowerCase();
      const arcana = personaArcanas.find(item => lower.includes(item.toLowerCase()));
      if (task.kind === "confidant" && arcana && (ranks[arcana] || 0) >= 10) continue;
      const supportsStat = task.kind === "stat" && lower.includes(lowestStat.toLowerCase());
      const useful = supportsStat || (missedCount > 0 && (task.kind === "confidant" || task.kind === "stat"));
      if (!useful || result.some(item => item.title === task.title)) continue;
      const personaNote = arcana ? personas.includes(arcana) ? ` Matching ${arcana} Persona ready.` : ` Bring a ${arcana} Persona.` : "";
      result.push({ date: day.date, title: task.title, detail: task.details[0] || `Use this opening to restore the route.`, kind: task.kind, placeId: placeFor(combined), reason: supportsStat ? `${lowestStat} is currently your lowest Social Stat.` : `Recommended replacement for a missed activity.${personaNote}` });
    }
    if (result.length >= 5) break;
  }
  return result.slice(0, 5);
}

export function encodeProfiles(profiles: PlayerProfile[], activeId: string) {
  const json = JSON.stringify({ version: 1, activeId, profiles });
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export function decodeProfiles(code: string): { profiles: PlayerProfile[]; activeId: string } {
  const binary = atob(code.trim());
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  const parsed = JSON.parse(new TextDecoder().decode(bytes));
  if (parsed?.version !== 1 || !Array.isArray(parsed.profiles) || !parsed.profiles.length) throw new Error("This route code is not valid.");
  const profiles: PlayerProfile[] = parsed.profiles.slice(0, 8).map((profile: Partial<PlayerProfile>, index: number) => normalizeProfile(profile, `Route ${index + 1}`));
  const activeId = profiles.some(profile => profile.id === parsed.activeId) ? parsed.activeId : profiles[0].id;
  return { profiles, activeId };
}
