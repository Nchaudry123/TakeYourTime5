export type ActivityType = "confidant" | "stat" | "palace" | "free";
export type Activity = { title: string; detail: string; type: ActivityType };
export type DayPlan = { title: string; afternoon: Activity; evening: Activity; dialogue?: string[] };

export const royalTargets = [
  { arcana: "Councillor", name: "Takuto Maruki", rank: 9, deadline: "NOV 17" },
  { arcana: "Justice", name: "Goro Akechi", rank: 8, deadline: "NOV 17" },
  { arcana: "Faith", name: "Kasumi Yoshizawa", rank: 5, deadline: "DEC 22" },
];

export const otherConfidants = [
  ["Chariot", "Ryuji"], ["Lovers", "Ann"], ["Death", "Takemi"],
  ["Temperance", "Kawakami"], ["Fortune", "Chihaya"], ["Emperor", "Yusuke"],
  ["Priestess", "Makoto"], ["Hermit", "Futaba"], ["Empress", "Haru"],
  ["Hierophant", "Sojiro"], ["Star", "Hifumi"], ["Hanged Man", "Iwai"],
  ["Tower", "Shinya"], ["Devil", "Ohya"], ["Sun", "Yoshida"], ["Moon", "Mishima"],
] as const;

export const schedule: Record<string, DayPlan> = {
  "4/9": { title: "Arrival in Tokyo", afternoon: { title: "Story progression", detail: "Settle into Leblanc and follow the evening story events.", type: "free" }, evening: { title: "Leblanc", detail: "Automatic story event. No free action available.", type: "free" } },
  "4/12": { title: "Class begins", afternoon: { title: "Class answer", detail: "Choose Villains to gain Knowledge.", type: "stat" }, evening: { title: "Story progression", detail: "Follow the mandatory evening sequence.", type: "free" }, dialogue: ["Villains"] },
  "4/15": { title: "The deadline is set", afternoon: { title: "Kamoshida investigation", detail: "Continue the mandatory Palace story sequence.", type: "palace" }, evening: { title: "Leblanc", detail: "Rest after the investigation.", type: "free" } },
  "4/16": { title: "Prepare your calling card", afternoon: { title: "Explore Shibuya", detail: "Buy healing supplies and check the underground mall before the Palace run.", type: "palace" }, evening: { title: "Study at Leblanc", detail: "Build Knowledge at the counter; rainy evenings award extra progress.", type: "stat" } },
  "4/17": { title: "Tool up", afternoon: { title: "Automatic story", detail: "Follow Ryuji and unlock infiltration tools.", type: "palace" }, evening: { title: "Craft lockpicks", detail: "Make infiltration tools at the work desk to raise Proficiency.", type: "stat" } },
  "4/18": { title: "Confidants unlocked", afternoon: { title: "Death — Takemi", detail: "Start the clinic trial and unlock the Death Confidant.", type: "confidant" }, evening: { title: "Study", detail: "Study at Leblanc and keep Knowledge moving toward Rank 2.", type: "stat" }, dialogue: ["I have a bad heart", "I agree"] },
  "4/19": { title: "Build momentum", afternoon: { title: "Chariot — Ryuji", detail: "Train with Ryuji. Bring a Chariot Persona when possible.", type: "confidant" }, evening: { title: "Crossword / study", detail: "Solve the crossword first, then study without spending an extra time slot.", type: "stat" } },
  "4/20": { title: "Secure the route", afternoon: { title: "Kamoshida Palace", detail: "Secure the infiltration route in one visit while conserving SP.", type: "palace" }, evening: { title: "Rest", detail: "Palace fatigue locks the evening action.", type: "free" } },
  "4/21": { title: "Send the calling card", afternoon: { title: "Calling card", detail: "Meet the team and send the calling card.", type: "palace" }, evening: { title: "Craft or read", detail: "Use Leblanc time for Proficiency or a book.", type: "stat" } },
  "5/13": { title: "Councillor begins", afternoon: { title: "Councillor — Maruki", detail: "Accept the counseling session. Royal priority begins today.", type: "confidant" }, evening: { title: "Bathhouse", detail: "Raise Charm; Monday and Thursday visits can be more effective.", type: "stat" } },
  "6/10": { title: "Justice begins", afternoon: { title: "Justice — Akechi", detail: "Meet at the café and begin the Justice route.", type: "confidant" }, evening: { title: "Justice — Akechi", detail: "Use his limited evening availability whenever a rank-up is ready.", type: "confidant" } },
  "10/31": { title: "Royal deadline warning", afternoon: { title: "Councillor check", detail: "Maruki should be Rank 8 or higher. Take every available session.", type: "confidant" }, evening: { title: "Justice check", detail: "Akechi should be Rank 7 or higher before his final manual rank.", type: "confidant" } },
  "11/17": { title: "Royal lock-in", afternoon: { title: "Councillor — Rank 9", detail: "Hard deadline: Maruki must reach Rank 9 today.", type: "confidant" }, evening: { title: "Justice — Rank 8", detail: "Hard deadline: Akechi must already be Rank 8.", type: "confidant" } },
  "12/22": { title: "Faith lock-in", afternoon: { title: "Faith — Rank 5", detail: "Reach Faith Rank 5 to unlock her remaining Royal ranks in January.", type: "confidant" }, evening: { title: "Final preparation", detail: "Check requests, equipment, and unfinished Social Stats.", type: "free" } },
};
