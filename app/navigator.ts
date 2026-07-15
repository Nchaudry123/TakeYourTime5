import type { GuideTask } from "./live-guide";

export type Place = {
  id: string;
  name: string;
  district: string;
  line: string;
  unlock: string;
  route: string[];
  spots: string[];
  keywords: string[];
  x: number;
  y: number;
  tone: "red" | "blue" | "white";
  unlockAt: string;
  unlockKind: "story" | "guide";
};

export type RailLink = { from: string; to: string; tone: "red" | "blue" | "white" };

export type Confidant = {
  arcana: string;
  name: string;
  place: string;
  spot: string;
  keywords?: string[];
};

export const places: Place[] = [
  { id: "yongen", name: "Yongen-Jaya", district: "Home District", line: "Commuter Pass", unlock: "Story event on 4/9", unlockAt: "4/9", unlockKind: "story", route: ["Press R1 to open the Rail Map", "Choose Yongen-Jaya", "Use the Backstreets for Leblanc, the clinic, bathhouse, and laundromat"], spots: ["Café Leblanc", "Takemi Medical Clinic", "Bathhouse", "Laundromat"], keywords: ["yongen", "leblanc", "clinic", "bathhouse", "laundromat", "coffee", "curry"], x: 14, y: 58, tone: "blue" },
  { id: "shibuya", name: "Shibuya", district: "Central Hub", line: "Commuter Pass", unlock: "Story event on 4/11", unlockAt: "4/11", unlockKind: "story", route: ["Press R1 and choose Shibuya", "Select Central Street, Underground Mall, Station Square, or Underground Walkway", "The commuter pass makes this route free"], spots: ["Central Street", "Underground Mall", "Station Square", "Airsoft Shop", "Arcade"], keywords: ["shibuya", "central street", "underground mall", "station square", "underground walkway", "airsoft", "flower shop", "beef bowl", "movie", "arcade"], x: 35, y: 55, tone: "red" },
  { id: "aoyama", name: "Aoyama-Itchome", district: "School District", line: "Commuter Pass", unlock: "Story event on 4/11", unlockAt: "4/11", unlockKind: "story", route: ["Press R1 and choose Aoyama-Itchome", "Select Shujin Academy", "Use the school map for the classroom, practice building, rooftop, or courtyard"], spots: ["Shujin Academy", "Practice Building", "School Rooftop", "Courtyard"], keywords: ["aoyama", "shujin", "school", "class", "classroom", "rooftop", "practice building", "courtyard"], x: 48, y: 55, tone: "white" },
  { id: "ogikubo", name: "Ogikubo", district: "Ramen District", line: "Invitation Route", unlock: "Ryuji Chariot Rank 4 on the guide route", unlockAt: "4/28", unlockKind: "guide", route: ["Reach Ryuji's Chariot Rank 4 event", "Accept the Ogikubo outing", "The ramen shop is then added to the map"], spots: ["Ramen Shop"], keywords: ["ogikubo", "ramen"], x: 24, y: 11, tone: "red" },
  { id: "harajuku", name: "Harajuku", district: "Shopping District", line: "Book / Invitation Route", unlock: "Read Vague from 5/18; the guide reveals it on 6/3", unlockAt: "6/3", unlockKind: "guide", route: ["Buy and read Vague from the Shibuya bookstore", "Harajuku appears on the Rail Map", "Choose Takeshita Street for an eligible outing"], spots: ["Takeshita Street"], keywords: ["harajuku", "takeshita"], x: 33, y: 34, tone: "white" },
  { id: "kichijoji", name: "Kichijoji", district: "Royal District", line: "Inokashira Route", unlock: "Story event on 6/5", unlockAt: "6/5", unlockKind: "story", route: ["Press R1 and choose Kichijoji", "Enter the promenade", "Darts & Billiards, the Jazz Club, temple, and used-clothing shop are on this map"], spots: ["Darts & Billiards", "Jazz Club", "Temple", "Used Clothing Shop"], keywords: ["kichijoji", "darts", "billiards", "jazz", "temple", "used clothing", "penguin sniper"], x: 10, y: 25, tone: "blue" },
  { id: "shinjuku", name: "Shinjuku", district: "Red-light District", line: "Paid Rail Route", unlock: "Story event on 6/18", unlockAt: "6/18", unlockKind: "story", route: ["Press R1 and choose Shinjuku", "Enter the Red-light District", "Chihaya is by her fortune stand; Crossroads bar is farther down the street"], spots: ["Fortune Stand", "Crossroads Bar", "Bookstore", "Flower Shop"], keywords: ["shinjuku", "red-light", "crossroads", "fortune", "chihaya", "ohya"], x: 42, y: 20, tone: "red" },
  { id: "kanda", name: "Kanda", district: "Church District", line: "Paid Rail Route", unlock: "After Kaneshiro's Palace, then Hifumi's introduction", unlockAt: "6/25", unlockKind: "story", route: ["Finish the Kaneshiro Palace story sequence", "Follow the introduction to Hifumi", "Choose Kanda and enter the church at night"], spots: ["Church", "Shogi Table"], keywords: ["kanda", "church", "shogi", "hifumi"], x: 73, y: 56, tone: "white" },
  { id: "odaiba", name: "Odaiba", district: "Seaside District", line: "Book / Invitation Route", unlock: "Read Nightlife Hotspots, available from 6/1", unlockAt: "7/1", unlockKind: "guide", route: ["Buy Nightlife Hotspots from the Shibuya bookstore", "Read it to reveal Odaiba Seaside Park", "Visit with an eligible Confidant"], spots: ["Seaside Park", "Ferris Wheel"], keywords: ["odaiba", "seaside park", "ferris wheel"], x: 58, y: 91, tone: "blue" },
  { id: "ichigaya", name: "Ichigaya", district: "Fishing District", line: "Book / Invitation Route", unlock: "Ryuji invitation on 7/3 or Fishpond Spotter from 7/17", unlockAt: "7/3", unlockKind: "guide", route: ["Accept Ryuji's fishing invitation or read Fishpond Spotter", "Choose Ichigaya", "Enter the fishing pond"], spots: ["Fishing Pond"], keywords: ["ichigaya", "fishing", "fishpond"], x: 57, y: 48, tone: "white" },
  { id: "ueno", name: "Ueno", district: "Museum District", line: "Confidant Route", unlock: "Yusuke Emperor Rank 3 on the guide route", unlockAt: "7/12", unlockKind: "guide", route: ["Reach Yusuke's Emperor Rank 3 event", "Complete the museum outing", "Ueno is added as a hangout destination"], spots: ["Art Museum"], keywords: ["ueno", "museum", "art"], x: 78, y: 25, tone: "white" },
  { id: "shinagawa", name: "Shinagawa", district: "Aquarium District", line: "Book / Confidant Route", unlock: "Aquarium-a-Day from 7/17 or Akechi Rank 5", unlockAt: "7/28", unlockKind: "guide", route: ["Read Aquarium-a-Day or accept Akechi's aquarium outing", "Choose Shinagawa", "Enter the aquarium"], spots: ["Aquarium"], keywords: ["shinagawa", "aquarium"], x: 41, y: 78, tone: "blue" },
  { id: "ikebukuro", name: "Ikebukuro", district: "Planetarium District", line: "Book / Invitation Route", unlock: "Mishima invitation on 7/29 or Night Skies from 9/1", unlockAt: "7/29", unlockKind: "guide", route: ["Accept Mishima's invitation or read Night Skies", "Choose Ikebukuro", "Enter the planetarium"], spots: ["Planetarium"], keywords: ["ikebukuro", "planetarium"], x: 62, y: 11, tone: "blue" },
  { id: "meiji", name: "Meiji Shrine", district: "Shrine District", line: "Book / Invitation Route", unlock: "Ann invitation on 8/6 or Tokyo Shrines from 9/1", unlockAt: "8/6", unlockKind: "guide", route: ["Accept Ann's invitation or read Tokyo Shrines", "Choose Meiji Shrine", "Use the shrine for affinity prayers"], spots: ["Affinity Shrine"], keywords: ["meiji", "shrine", "affinity"], x: 29, y: 45, tone: "white" },
  { id: "jinbocho", name: "Jinbocho", district: "Book Town", line: "Book / Invitation Route", unlock: "Makoto invitation on 8/15 or Musty Pages from 9/1", unlockAt: "8/15", unlockKind: "guide", route: ["Accept Makoto's invitation or read Musty Pages", "Press R1 and choose Jinbocho", "Finish the specialized bookstore's books in order"], spots: ["Nagiuri Bookstore"], keywords: ["jinbocho", "book town", "specialized bookstore"], x: 67, y: 48, tone: "white" },
  { id: "akihabara", name: "Akihabara", district: "Electric Town", line: "Paid Rail Route", unlock: "Story event on 8/31", unlockAt: "8/31", unlockKind: "story", route: ["Press R1 and choose Akihabara", "Use Electric Town", "The arcade is Shinya's usual meeting point; the maid café and electronics shops are nearby"], spots: ["Gigolo Arcade", "Maid Café", "Electronics Shop", "Machine Parts Shop"], keywords: ["akihabara", "electric town", "maid café", "maid cafe", "gigolo arcade", "shinya"], x: 86, y: 49, tone: "blue" },
  { id: "nakano", name: "Nakano", district: "Shopping District", line: "Invitation Route", unlock: "Futaba invitation on 10/8", unlockAt: "10/8", unlockKind: "guide", route: ["Accept Futaba's 10/8 invitation", "Nakano appears on the map", "Enter the shopping mall"], spots: ["Shopping Mall"], keywords: ["nakano", "shopping mall"], x: 19, y: 35, tone: "red" },
  { id: "maihama", name: "Maihama", district: "Theme Park District", line: "Story / Book Route", unlock: "Story visit on 10/11 or Theme Park Escort", unlockAt: "10/11", unlockKind: "story", route: ["Complete the 10/11 story visit or read Theme Park Escort", "Choose Maihama", "Enter Destinyland with an eligible Confidant"], spots: ["Destinyland"], keywords: ["maihama", "destinyland", "theme park"], x: 89, y: 78, tone: "red" },
  { id: "metaverse", name: "Metaverse", district: "Palaces & Mementos", line: "Team Meeting", unlock: "Story progression", unlockAt: "4/9", unlockKind: "story", route: ["Open the hideout or team meeting prompt", "Choose Palace or Mementos", "Confirm the infiltration only after completing all real-world preparation"], spots: ["Current Palace", "Mementos", "Safe Rooms"], keywords: ["palace", "mementos", "calling card", "treasure route", "infiltration"], x: 65, y: 82, tone: "red" },
];

export const railLinks: RailLink[] = [
  { from: "kichijoji", to: "shibuya", tone: "blue" },
  { from: "yongen", to: "shibuya", tone: "blue" },
  { from: "shibuya", to: "aoyama", tone: "white" },
  { from: "aoyama", to: "shinjuku", tone: "red" },
  { from: "shinjuku", to: "ikebukuro", tone: "blue" },
  { from: "ikebukuro", to: "ueno", tone: "blue" },
  { from: "ueno", to: "akihabara", tone: "blue" },
  { from: "akihabara", to: "kanda", tone: "white" },
  { from: "kanda", to: "jinbocho", tone: "white" },
  { from: "jinbocho", to: "ichigaya", tone: "red" },
  { from: "ichigaya", to: "aoyama", tone: "red" },
  { from: "ogikubo", to: "harajuku", tone: "white" },
  { from: "harajuku", to: "shibuya", tone: "white" },
  { from: "meiji", to: "harajuku", tone: "white" },
  { from: "nakano", to: "kichijoji", tone: "red" },
  { from: "aoyama", to: "shinagawa", tone: "blue" },
  { from: "shinagawa", to: "odaiba", tone: "blue" },
  { from: "odaiba", to: "maihama", tone: "red" },
];

export const confidants: Confidant[] = [
  { arcana: "Fool", name: "Igor", place: "metaverse", spot: "Velvet Room" },
  { arcana: "Magician", name: "Morgana", place: "yongen", spot: "Story progression" },
  { arcana: "Priestess", name: "Makoto Niijima", place: "aoyama", spot: "Shujin student council area" },
  { arcana: "Empress", name: "Haru Okumura", place: "aoyama", spot: "Shujin rooftop" },
  { arcana: "Emperor", name: "Yusuke Kitagawa", place: "shibuya", spot: "Underground Walkway" },
  { arcana: "Hierophant", name: "Sojiro Sakura", place: "yongen", spot: "Café Leblanc" },
  { arcana: "Lovers", name: "Ann Takamaki", place: "shibuya", spot: "Underground Mall" },
  { arcana: "Chariot", name: "Ryuji Sakamoto", place: "aoyama", spot: "Shujin 2F; Shibuya arcade on days off" },
  { arcana: "Justice", name: "Goro Akechi", place: "kichijoji", spot: "Darts & Billiards entrance" },
  { arcana: "Hermit", name: "Futaba Sakura", place: "yongen", spot: "Outside Café Leblanc" },
  { arcana: "Fortune", name: "Chihaya Mifune", place: "shinjuku", spot: "Fortune stand" },
  { arcana: "Strength", name: "Caroline & Justine", place: "metaverse", spot: "Velvet Room entrance" },
  { arcana: "Hanged Man", name: "Munehisa Iwai", place: "shibuya", spot: "Untouchable Airsoft Shop" },
  { arcana: "Death", name: "Tae Takemi", place: "yongen", spot: "Takemi Medical Clinic" },
  { arcana: "Temperance", name: "Sadayo Kawakami", place: "yongen", spot: "Call from Café Leblanc" },
  { arcana: "Devil", name: "Ichiko Ohya", place: "shinjuku", spot: "Crossroads Bar" },
  { arcana: "Tower", name: "Shinya Oda", place: "akihabara", spot: "Gigolo Arcade" },
  { arcana: "Star", name: "Hifumi Togo", place: "kanda", spot: "Church" },
  { arcana: "Moon", name: "Yuuki Mishima", place: "shibuya", spot: "Central Street; later Akihabara" },
  { arcana: "Sun", name: "Toranosuke Yoshida", place: "shibuya", spot: "Station Square" },
  { arcana: "Faith", name: "Kasumi Yoshizawa", place: "kichijoji", spot: "Invitation-based meetings" },
  { arcana: "Councillor", name: "Takuto Maruki", place: "aoyama", spot: "Shujin practice building" },
  { arcana: "Judgement", name: "Sae Niijima", place: "shibuya", spot: "Story progression" },
];

export function findConfidant(task: GuideTask) {
  const text = `${task.title} ${task.details.join(" ")}`.toLowerCase();
  return confidants.find(confidant => text.includes(confidant.arcana.toLowerCase()) || text.includes(confidant.name.toLowerCase()) || confidant.keywords?.some(keyword => text.includes(keyword)));
}

export function findPlace(task: GuideTask) {
  const text = `${task.title} ${task.details.join(" ")}`.toLowerCase();
  const named = places.find(place => text.includes(place.name.toLowerCase()) || text.includes(place.id));
  if (named) return named;
  const direct = places.find(place => place.keywords.some(keyword => text.includes(keyword)));
  if (direct) return direct;
  const confidant = findConfidant(task);
  return confidant ? places.find(place => place.id === confidant.place) : undefined;
}
