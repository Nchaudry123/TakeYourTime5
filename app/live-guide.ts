export const LIVE_GUIDE_URL = "https://aqiu384.github.io/megaten-database/p5r/ace-walkthrough";

export type GuideKind = "confidant" | "stat" | "palace" | "prep" | "story";

export type GuideTask = {
  title: string;
  details: string[];
  section: string;
  kind: GuideKind;
  answer: boolean;
};

export type GuideDay = {
  date: string;
  weekday: string;
  tasks: GuideTask[];
};

const CACHE_KEY = "take-your-time-guide-cache-v2";

function clean(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function classify(text: string): GuideKind {
  const lower = text.toLowerCase();
  if (/palace|mementos|calling card|take treasure|reach treasure/.test(lower)) return "palace";
  if (/rank\s|confidant|arcana/.test(lower)) return "confidant";
  if (/shop|obtain|need at least|need enough|buy |potted plant|tv shopping|aojiru/.test(lower)) return "prep";
  if (/knowledge|guts|proficiency|kindness|charm|books? >|dvds? >|bathhouse|crafting|job|study/.test(lower)) return "stat";
  return "story";
}

function directText(item: Element) {
  const clone = item.cloneNode(true) as Element;
  clone.querySelectorAll("ul, ol").forEach(node => node.remove());
  return clean(clone.textContent);
}

export function parseGuideHtml(html: string): GuideDay[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const days: GuideDay[] = [];

  doc.querySelectorAll("h4").forEach(heading => {
    const match = clean(heading.textContent).match(/^(\d{1,2})\/(\d{1,2})\s+([A-Za-z]{3})/);
    if (!match) return;
    const date = `${Number(match[1])}/${Number(match[2])}`;
    const weekday = match[3].toUpperCase();
    const tasks: GuideTask[] = [];
    let section = "Story";
    let node = heading.nextElementSibling;

    while (node && node.tagName !== "H4" && node.tagName !== "H3") {
      if (node.tagName === "H5") section = clean(node.textContent).replace(/\s*\(.+\)$/, "");
      if (node.tagName === "UL" || node.tagName === "OL") {
        Array.from(node.children).filter(child => child.tagName === "LI").forEach(item => {
          const title = directText(item);
          if (!title) return;
          const details = Array.from(item.querySelectorAll(":scope > ul > li, :scope > ol > li")).map(detail => clean(detail.textContent)).filter(Boolean);
          const combined = `${title} ${details.join(" ")}`;
          tasks.push({
            title,
            details,
            section,
            kind: classify(combined),
            answer: /choice\s|phone\s|question:|exam question|answer/i.test(combined),
          });
        });
      }
      node = node.nextElementSibling;
    }
    days.push({ date, weekday, tasks });
  });
  return days;
}

export function readCachedGuide(): { days: GuideDay[]; syncedAt: string } | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return Array.isArray(parsed?.days) ? parsed : null;
  } catch {
    return null;
  }
}

export async function fetchLiveGuide(): Promise<{ days: GuideDay[]; syncedAt: string }> {
  const response = await fetch(LIVE_GUIDE_URL, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Guide returned ${response.status}`);
  const html = await response.text();
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  const days = parseGuideHtml(html);
  if (days.length < 200) throw new Error("Guide calendar was incomplete");
  const result = { days, syncedAt: new Date().toISOString() };
  setTimeout(() => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch { /* The live guide remains usable without cache space. */ }
  }, 0);
  return result;
}
