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
};

export type Confidant = {
  arcana: string;
  name: string;
  place: string;
  spot: string;
  keywords?: string[];
};

export const places: Place[] = [
  { id: "yongen", name: "Yongen-Jaya", district: "Home District", line: "Commuter Pass", unlock: "Available from 4/9", route: ["Press R1 to open the Rail Map", "Choose Yongen-Jaya", "Use the Backstreets for Leblanc, the clinic, bathhouse, and laundromat"], spots: ["Café Leblanc", "Takemi Medical Clinic", "Bathhouse", "Laundromat"], keywords: ["yongen", "leblanc", "clinic", "bathhouse", "laundromat", "coffee", "curry"], x: 19, y: 56, tone: "blue" },
  { id: "shibuya", name: "Shibuya", district: "Central Hub", line: "Commuter Pass", unlock: "Available from 4/9", route: ["Press R1 and choose Shibuya", "Select Central Street, Underground Mall, Station Square, or Underground Walkway", "The commuter pass makes this route free"], spots: ["Central Street", "Underground Mall", "Station Square", "Airsoft Shop", "Arcade"], keywords: ["shibuya", "central street", "underground mall", "station square", "underground walkway", "airsoft", "flower shop", "beef bowl", "movie", "arcade"], x: 35, y: 53, tone: "red" },
  { id: "aoyama", name: "Aoyama-Itchome", district: "School District", line: "Commuter Pass", unlock: "Available from 4/11", route: ["Press R1 and choose Aoyama-Itchome", "Select Shujin Academy", "Use the school map for the classroom, practice building, rooftop, or courtyard"], spots: ["Shujin Academy", "Practice Building", "School Rooftop", "Courtyard"], keywords: ["aoyama", "shujin", "school", "class", "classroom", "rooftop", "practice building", "courtyard"], x: 46, y: 52, tone: "white" },
  { id: "kichijoji", name: "Kichijoji", district: "Royal District", line: "Inokashira Route", unlock: "Unlocks automatically on 6/5", route: ["Press R1 and choose Kichijoji", "Enter the promenade", "Darts & Billiards, the Jazz Club, temple, and used-clothing shop are on this map"], spots: ["Darts & Billiards", "Jazz Club", "Temple", "Used Clothing Shop"], keywords: ["kichijoji", "darts", "billiards", "jazz", "temple", "used clothing", "penguin sniper"], x: 14, y: 13, tone: "blue" },
  { id: "shinjuku", name: "Shinjuku", district: "Red-light District", line: "Paid Rail Route", unlock: "Unlocks through the 6/18 story event", route: ["Press R1 and choose Shinjuku", "Enter the Red-light District", "Chihaya is by her fortune stand; Crossroads bar is farther down the street"], spots: ["Fortune Stand", "Crossroads Bar", "Bookstore", "Flower Shop"], keywords: ["shinjuku", "red-light", "crossroads", "fortune", "chihaya", "ohya"], x: 40, y: 20, tone: "red" },
  { id: "akihabara", name: "Akihabara", district: "Electric Town", line: "Paid Rail Route", unlock: "Unlocks automatically on 9/1", route: ["Press R1 and choose Akihabara", "Use Electric Town", "The arcade is Shinya's usual meeting point; the maid café and electronics shops are nearby"], spots: ["Gigolo Arcade", "Maid Café", "Electronics Shop", "Machine Parts Shop"], keywords: ["akihabara", "electric town", "maid café", "maid cafe", "gigolo arcade", "shinya"], x: 79, y: 44, tone: "blue" },
  { id: "kanda", name: "Kanda", district: "Church District", line: "Paid Rail Route", unlock: "Unlocks through Hifumi's invitation", route: ["Press R1 and choose Kanda", "Enter the church", "Hifumi plays shogi near the front of the sanctuary at night"], spots: ["Church", "Shogi Table"], keywords: ["kanda", "church", "shogi", "hifumi"], x: 76, y: 55, tone: "white" },
  { id: "jinbocho", name: "Jinbocho", district: "Book Town", line: "Paid Rail Route", unlock: "Unlock via a location book", route: ["Read the location book that reveals Jinbocho", "Press R1 and choose Jinbocho", "Visit the specialized bookstore and finish its books in order"], spots: ["Nagiuri Bookstore"], keywords: ["jinbocho", "book town", "specialized bookstore"], x: 68, y: 49, tone: "white" },
  { id: "ogikubo", name: "Ogikubo", district: "Ramen District", line: "Invitation Route", unlock: "Unlocks through Ryuji's invitation", route: ["Accept Ryuji's invitation or unlock the location", "Press R1 and choose Ogikubo", "Enter the ramen shop"], spots: ["Ramen Shop"], keywords: ["ogikubo", "ramen"], x: 25, y: 5, tone: "red" },
  { id: "harajuku", name: "Harajuku", district: "Shopping District", line: "Invitation / Book Route", unlock: "Unlock via invitation or location book", route: ["Unlock Harajuku from an invitation or book", "Press R1 and choose Harajuku", "Enter Takeshita Street"], spots: ["Takeshita Street"], keywords: ["harajuku", "takeshita"], x: 35, y: 37, tone: "white" },
  { id: "odaiba", name: "Odaiba", district: "Seaside District", line: "Paid Rail Route", unlock: "Unlock via invitation or location book", route: ["Unlock the seaside destination", "Press R1 and choose Odaiba", "Select Seaside Park or the shopping area"], spots: ["Seaside Park", "Ferris Wheel"], keywords: ["odaiba", "seaside park", "ferris wheel"], x: 52, y: 93, tone: "blue" },
  { id: "metaverse", name: "Metaverse", district: "Palaces & Mementos", line: "Team Meeting", unlock: "Story progression", route: ["Open the hideout or team meeting prompt", "Choose Palace or Mementos", "Confirm the infiltration only after completing all real-world preparation"], spots: ["Current Palace", "Mementos", "Safe Rooms"], keywords: ["palace", "mementos", "calling card", "treasure route", "infiltration"], x: 65, y: 82, tone: "red" },
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
