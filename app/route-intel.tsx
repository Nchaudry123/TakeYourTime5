"use client";

import { palaceNames, personaArcanas, socialStatNames, type Alternative, type DeadlineRisk, type PlayerProfile, type RecoveryAction, type SocialStatName, type Weather } from "./adaptive-planner";

type Props = {
  profile: PlayerProfile;
  profiles: PlayerProfile[];
  activeId: string;
  risks: DeadlineRisk[];
  alternatives: Alternative[];
  recovery: RecoveryAction[];
  missedCount: number;
  exportCode: string;
  importCode: string;
  importError: string;
  navigatorName: string;
  navigatorUnlocked: boolean;
  onSelectProfile: (id: string) => void;
  onCreateProfile: () => void;
  onDeleteProfile: () => void;
  onRenameProfile: (name: string) => void;
  onStat: (stat: SocialStatName, value: number) => void;
  onRank: (arcana: string, delta: number) => void;
  onMoney: (money: number) => void;
  onWeather: (weather: Weather) => void;
  onPalace: (palace: string) => void;
  onPersona: (arcana: string) => void;
  onRoute: (placeId: string) => void;
  onCopy: () => void;
  onImportCode: (code: string) => void;
  onImport: () => void;
};

export default function RouteIntel({ profile, profiles, activeId, risks, alternatives, recovery, missedCount, exportCode, importCode, importError, navigatorName, navigatorUnlocked, onSelectProfile, onCreateProfile, onDeleteProfile, onRenameProfile, onStat, onRank, onMoney, onWeather, onPalace, onPersona, onRoute, onCopy, onImportCode, onImport }: Props) {
  const overall = risks.some(risk => risk.status === "critical") ? "critical" : risks.some(risk => risk.status === "tight") ? "tight" : "safe";
  return <div className="intel-panel">
    <div className={`plan-heading intel-heading ${navigatorUnlocked ? "awakened" : "pre-nav"}`}><span>{navigatorName}</span><h1>ROUTE INTEL</h1><p>{navigatorUnlocked ? "Oracle online · adaptive playthrough control" : "Anonymous tactical model · identity encrypted"}</p></div>

    <section className="profile-switcher">
      <div><small>ACTIVE SAVE</small><select value={activeId} onChange={event => onSelectProfile(event.target.value)} aria-label="Active playthrough profile">{profiles.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
      <label><small>CODENAME</small><input value={profile.name} maxLength={32} onChange={event => onRenameProfile(event.target.value)} aria-label="Profile name" /></label>
      <button type="button" onClick={onCreateProfile}>+ NEW ROUTE</button>
      <button type="button" className="danger" disabled={profiles.length <= 1} onClick={onDeleteProfile}>DELETE</button>
    </section>

    <section className={`route-verdict ${overall}`}>
      <div><small>ROUTE CONDITION</small><strong>{overall === "safe" ? "ON TRACK" : overall === "tight" ? "TIME IS TIGHT" : "DEADLINE AT RISK"}</strong><p>{missedCount ? `${missedCount} missed activit${missedCount === 1 ? "y" : "ies"} detected. Recovery priorities have been rebuilt.` : "No missed activities logged for this profile."}</p></div>
      <b>{overall === "safe" ? "✓" : overall === "tight" ? "!" : "!!"}</b>
    </section>

    <div className="intel-grid">
      <section className="intel-card risk-card"><header><small>01</small><div><b>ROYAL DEADLINE RADAR</b><span>Protected milestones</span></div></header><div className="risk-list">{risks.map(risk => <article className={risk.status} key={risk.arcana}><i>{risk.status === "safe" ? "✓" : "!"}</i><div><small>{risk.arcana} · {risk.deadline}</small><strong>{risk.name}</strong><span>{risk.message}</span></div><b>{risk.current}/{risk.target}</b></article>)}</div></section>

      <section className="intel-card stat-card"><header><small>02</small><div><b>SOCIAL STATS</b><span>Actual player levels</span></div></header><div className="stat-trackers">{socialStatNames.map(stat => <div key={stat}><span>{stat}</span><span className="stat-stepper"><button type="button" onClick={() => onStat(stat, profile.stats[stat] - 1)} aria-label={`Lower ${stat}`}>−</button><i>{[1, 2, 3, 4, 5].map(rank => <b className={rank <= profile.stats[stat] ? "filled" : ""} key={rank} />)}</i><button type="button" onClick={() => onStat(stat, profile.stats[stat] + 1)} aria-label={`Raise ${stat}`}>+</button></span><strong>RANK {profile.stats[stat]}</strong></div>)}</div><div className="resource-row"><label><span>WALLET</span><input type="number" min="0" step="100" value={profile.money} onChange={event => onMoney(Number(event.target.value))} /><b>¥</b></label><label><span>WEATHER</span><select value={profile.weather} onChange={event => onWeather(event.target.value as Weather)}>{["Clear", "Rain", "Pollen", "Heat Wave", "Flu Season"].map(weather => <option key={weather}>{weather}</option>)}</select></label></div></section>

      <section className="intel-card rank-card"><header><small>03</small><div><b>CONFIDANT NETWORK</b><span>Real ranks drive the route</span></div></header><div className="rank-network">{Object.entries(profile.ranks).sort(([a], [b]) => a.localeCompare(b)).map(([arcana, rank]) => <article key={arcana}><span><small>{arcana}</small><strong>{rank}/10</strong></span><span><button type="button" onClick={() => onRank(arcana, -1)}>−</button><i><b style={{ width: `${rank * 10}%` }} /></i><button type="button" onClick={() => onRank(arcana, 1)}>+</button></span></article>)}</div></section>

      <section className="intel-card recovery-card"><header><small>04</small><div><b>RECOVERY QUEUE</b><span>Best openings after route drift</span></div></header><div className="recovery-list">{recovery.length ? recovery.map((action, index) => <article key={`${action.date}-${action.title}`}><i>{String(index + 1).padStart(2, "0")}</i><div><small>{action.date} · {action.kind}</small><strong>{action.title}</strong><span>{action.reason}</span></div><button type="button" onClick={() => onRoute(action.placeId)}>R1 ROUTE</button></article>) : <p className="empty-intel">The route is clean. Miss an activity or adjust your ranks to generate a recovery queue.</p>}</div></section>
    </div>

    <section className="alternatives-board"><header><span>BACKUP TACTICS</span><h2>OPEN-SLOT ALTERNATIVES</h2><p>Weekday, weather, unlock, stat, and wallet checks are applied before an option is recommended.</p></header><div>{alternatives.map(option => <article className={option.available ? "available" : "locked"} key={option.id}><span className="alt-status">{option.available ? "AVAILABLE" : "LOCKED"}</span><small>{option.slot} · {option.cost ? `¥${option.cost}` : "FREE"}</small><strong>{option.title}</strong><p>{option.detail}</p><b>{option.gain}</b><em>{option.reason}</em><button type="button" disabled={!option.available} onClick={() => onRoute(option.placeId)}>USE + OPEN MAP →</button></article>)}</div></section>

    <section className="collection-grid">
      <article><header><small>PALACE BOARD</small><strong>PROGRESS FLAGS</strong></header><div>{palaceNames.map(palace => <button type="button" className={profile.palaces.includes(palace) ? "owned" : ""} onClick={() => onPalace(palace)} key={palace}>{profile.palaces.includes(palace) ? "✓ " : ""}{palace}</button>)}</div></article>
      <article><header><small>PERSONA STOCK</small><strong>ARCANA COVERAGE</strong></header><div>{personaArcanas.map(arcana => <button type="button" className={profile.personas.includes(arcana) ? "owned" : ""} onClick={() => onPersona(arcana)} key={arcana}>{profile.personas.includes(arcana) ? "◆ " : "◇ "}{arcana}</button>)}</div></article>
    </section>

    <section className="route-transfer"><header><small>DEVICE TRANSFER</small><h2>STEAL YOUR SAVE</h2><p>Copy this compact route code to move every profile, rank, flag, and completion to another device.</p></header><div><label><span>EXPORT CODE</span><textarea readOnly value={exportCode} aria-label="Export route code" /></label><button type="button" onClick={onCopy}>COPY CODE</button><label><span>IMPORT CODE</span><textarea value={importCode} onChange={event => onImportCode(event.target.value)} placeholder="Paste a Take Your Time route code…" aria-label="Import route code" /></label><button type="button" onClick={onImport}>IMPORT ROUTES</button></div>{importError && <strong className="import-error">{importError}</strong>}</section>
  </div>;
}
