import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  Search,
  GripVertical,
  Settings2,
  History,
  Trophy,
  Zap,
  LockKeyhole,
  Pause,
  Play,
  ChevronRight,
  Check,
  Layers,
  Radio,
  RotateCcw,
} from "lucide-react";
import { players, positions } from "./players";
import {
  createDraft,
  makePick,
  aiPick,
  gradeTeam,
  teamNames,
  defaultWeights,
  reorder,
} from "./engine";
import {
  generateLicense,
  verifyLicense,
  canStart,
  allowedConfig,
  localDate,
} from "./license";
import { read, write } from "./storage";
import "./style.css";

function App() {
  const [pro, setPro] = useState(false),
    [ready, setReady] = useState(false),
    [draft, setDraft] = useState(null),
    [config, setConfig] = useState({
      teams: 8,
      rounds: 15,
      clock: 30,
      keeper: false,
    }),
    [weights, setWeights] = useState(defaultWeights);
  const [queue, setQueue] = useState([]),
    [filter, setFilter] = useState("ALL"),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState(null),
    [license, setLicense] = useState(""),
    [message, setMessage] = useState(""),
    [paused, setPaused] = useState(false),
    [auto, setAuto] = useState(false),
    [seconds, setSeconds] = useState(30),
    [history, setHistory] = useState(() => {
      const h = read("history", []);
      return Array.isArray(h)
        ? h
            .filter(
              (d) =>
                d &&
                d.done &&
                Array.isArray(d.rosters) &&
                Array.isArray(d.picks),
            )
            .slice(0, 20)
        : [];
    }),
    [past, setPast] = useState(null),
    [keepers, setKeepers] = useState([]);
  const deadline = useRef(0),
    remaining = useRef(30000),
    dragId = useRef(null),
    saved = useRef(null),
    draftRef = useRef(draft);
  draftRef.current = draft;
  useEffect(() => {
    verifyLicense(read("license", "")).then((valid) => {
      setPro(valid);
      setReady(true);
    });
  }, []);
  const current = draft?.order[draft.picks.length] ?? 0,
    human = !!draft && !draft.done && current === 0;
  const pool = draft?.available ?? players;
  const queued = queue
    .map((id) => pool.find((p) => p.id === id))
    .filter(Boolean);
  const displayed = pool.filter(
    (p) =>
      (filter === "ALL" || p.position === filter) &&
      `${p.name} ${p.team}`.toLowerCase().includes(query.toLowerCase()),
  );
  const active = draft && !draft.done;
  const report = past || (draft?.done ? draft : null);
  function notice(text) {
    setMessage(text);
  }
  function pick(id, source = "manual") {
    setDraft((s) => {
      if (!s || s.done) return s;
      return makePick(s, id, source);
    });
  }
  useEffect(() => {
    if (!active) return;
    remaining.current = config.clock * 1000;
    setSeconds(config.clock);
  }, [draft?.picks.length, active, config.clock]);
  useEffect(() => {
    if (!active || paused) return;
    deadline.current = Date.now() + remaining.current;
    const tick = () => {
      const left = Math.max(0, deadline.current - Date.now());
      remaining.current = left;
      setSeconds(Math.ceil(left / 1000));
      if (left === 0) {
        const s = draftRef.current;
        if (s && !s.done) {
          const t = s.order[s.picks.length];
          const p = aiPick(
            s.available,
            s.rosters[t],
            t === 0 ? defaultWeights : weights,
          );
          pick(p.id, "clock");
        }
      }
    };
    const timer = setInterval(tick, 100);
    return () => clearInterval(timer);
  }, [draft?.picks.length, active, paused, weights]);
  useEffect(() => {
    if (!active || paused || (human && !auto)) return;
    const timer = setTimeout(
      () => {
        const s = draftRef.current;
        const t = s.order[s.picks.length];
        const p =
          t === 0 && queued.length
            ? queued[0]
            : aiPick(
                s.available,
                s.rosters[t],
                t === 0 ? defaultWeights : weights,
              );
        pick(p.id, t === 0 ? "autopilot" : "AI");
      },
      auto ? 120 : 1400,
    );
    return () => clearTimeout(timer);
  }, [draft?.picks.length, active, paused, human, auto, weights, queue]);
  useEffect(() => {
    if (!draft?.done || saved.current === draft) return;
    saved.current = draft;
    if (pro) {
      const next = [
        { ...draft, finishedAt: new Date().toISOString() },
        ...history,
      ].slice(0, 20);
      if (write("history", next)) setHistory(next);
      else notice("Browser storage is full. This draft could not be saved.");
    }
    setAuto(false);
  }, [draft, pro]);
  function start() {
    if (!ready) return;
    if (!canStart(pro, read("lastDraft", null))) {
      notice(
        "Your free draft is used for today. Come back tomorrow or activate Demo Pro.",
      );
      setModal("pro");
      return;
    }
    if (!allowedConfig(pro, config)) {
      notice("Check your league settings. Free leagues have 8 teams.");
      return;
    }
    if (!pro && !write("lastDraft", localDate())) {
      notice(
        "Browser storage is unavailable. Enable local storage to start a free draft.",
      );
      return;
    }
    setDraft(createDraft(config, config.keeper ? keepers : []));
    setPast(null);
    setPaused(false);
    setAuto(false);
    setModal(null);
    setMessage("");
  }
  async function activate(key = license) {
    if (await verifyLicense(key.trim())) {
      setPro(true);
      if (!write("license", key.trim()))
        notice(
          "Pro activated for this session; browser storage is unavailable.",
        );
      else notice("Demo Pro activated. Your war room is unlocked.");
      setModal(null);
    } else
      notice(
        "That license is not valid. Use the demo key or generate a new one.",
      );
  }
  function queuePlayer(id) {
    setQueue((q) => (q.includes(id) ? q.filter((x) => x !== id) : [...q, id]));
  }
  function reset() {
    setDraft(null);
    setPast(null);
    setQueue([]);
    setPaused(false);
    setAuto(false);
    setModal(null);
  }
  const total = draft?.order.length ?? config.teams * config.rounds;
  const round = draft
    ? Math.min(config.rounds, Math.floor(draft.picks.length / config.teams) + 1)
    : 1;
  const nextHuman = draft
    ? draft.order.slice(draft.picks.length).indexOf(0)
    : 0;
  const recent = draft?.picks.slice(-4).reverse() ?? [];
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="./">
          <span className="brand-icon">
            D<span>↗</span>
          </span>
          DraftRoom<span className="beta">BETA</span>
        </a>
        <nav aria-label="Main navigation">
          <button
            className={!past ? "nav-active" : ""}
            onClick={() => setPast(null)}
          >
            <Layers size={16} /> Draft room
          </button>
          <button onClick={() => (pro ? setModal("history") : setModal("pro"))}>
            <History size={16} /> History {!pro && <LockKeyhole size={12} />}
          </button>
        </nav>
        <button className="pro-button" onClick={() => setModal("pro")}>
          <Zap size={14} />
          {pro ? "DEMO PRO" : "Unlock Pro"}
          <ArrowRight size={14} />
        </button>
      </header>
      <main>
        <div className="heading">
          <div>
            <div className="eyebrow">
              <span className="dot" /> YOUR EDGE STARTS HERE
            </div>
            <h1>
              {report ? "The picks are in." : "On the clock."}
              <span>{report ? " Own the results." : " Own the draft."}</span>
            </h1>
            <p>
              {report
                ? "A clear-eyed look at your roster, your value, and your competition."
                : "Practice the picks. Find your sleepers. Build a team worth bragging about."}
            </p>
          </div>
          <div className="season-stamp">
            <span>FANTASY FOOTBALL</span>
            <strong>THE PRACTICE FIELD</strong>
            <small>Historical pool · Illustrative projections</small>
          </div>
        </div>
        {message && (
          <div className="notice" role="status">
            {message}
            <button
              aria-label="Dismiss notification"
              onClick={() => setMessage("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {report ? (
          <Results
            draft={report}
            onNew={() => {
              reset();
            }}
            onKeeper={() => {
              setKeepers(
                report.rosters.map((r) =>
                  [...r].sort((a, b) => b.value - a.value).slice(0, 2),
                ),
              );
              setConfig({ ...report.config, keeper: true });
              reset();
              setModal("settings");
            }}
            pro={pro}
          />
        ) : (
          <>
            <section className="room-controls">
              <div className="room-name">
                <span className="room-symbol">
                  <Radio size={20} />
                </span>
                <div>
                  <strong>
                    {active
                      ? "The draft is live"
                      : draft?.done
                        ? "Draft complete"
                        : "Your draft room"}
                  </strong>
                  <small>
                    {config.teams} teams <i /> Snake order <i /> {config.rounds}{" "}
                    rounds <i /> {config.keeper ? "Keeper" : "Redraft"}
                  </small>
                </div>
              </div>
              <div className="control-actions">
                <button
                  className="secondary"
                  onClick={() => setModal("settings")}
                  disabled={!!draft}
                >
                  <Settings2 size={15} /> League settings
                </button>
                {!draft ? (
                  <button className="primary" onClick={start} disabled={!ready}>
                    Enter the draft <ArrowRight size={17} />
                  </button>
                ) : (
                  <>
                    <button
                      className="secondary"
                      onClick={() => setPaused(!paused)}
                    >
                      {paused ? <Play size={14} /> : <Pause size={14} />}{" "}
                      {paused ? "Resume" : "Pause"}
                    </button>
                    <button
                      className={auto ? "primary" : "secondary"}
                      onClick={() => setAuto(!auto)}
                    >
                      <Zap size={14} />
                      {auto ? "Stop autopilot" : "Autopilot"}
                    </button>
                  </>
                )}
              </div>
            </section>
            <section className="draft-strip" aria-label="Draft order">
              {Array.from(
                { length: Math.min(8, total - (draft?.picks.length ?? 0)) },
                (_, i) => {
                  const idx = (draft?.picks.length ?? 0) + i;
                  const ti = draft?.order[idx] ?? i;
                  return (
                    <div
                      key={idx}
                      className={`draft-seat ${i === 0 ? "on-clock" : ""} ${ti === 0 ? "your-seat" : ""}`}
                    >
                      <span>
                        {i === 0
                          ? active
                            ? "ON THE CLOCK"
                            : "FIRST PICK"
                          : `PICK ${String(idx + 1).padStart(2, "0")}`}
                      </span>
                      <strong>{ti === 0 ? "You" : teamNames[ti]}</strong>
                      <small>
                        {String(Math.floor(idx / config.teams) + 1).padStart(
                          2,
                          "0",
                        )}
                        .{String((idx % config.teams) + 1).padStart(2, "0")}{" "}
                        {i === 0 && <span className="dot" />}
                      </small>
                    </div>
                  );
                },
              )}
            </section>
            <div className="desk">
              <section className="panel player-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Player board <span className="count">{pool.length}</span>
                    </h2>
                    <p>The next difference-maker is still out there.</p>
                  </div>
                  <span className="tiny-label">PROJECTED PPR</span>
                </div>
                <div className="board-tools">
                  <div className="tabs" aria-label="Position filter">
                    {["ALL", ...positions].map((p) => (
                      <button
                        key={p}
                        className={filter === p ? "selected" : ""}
                        onClick={() => setFilter(p)}
                      >
                        {p === "ALL" ? "All players" : p}
                      </button>
                    ))}
                  </div>
                  <label className="search">
                    <Search size={16} />
                    <input
                      aria-label="Search players"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Find a player or team…"
                    />
                    <kbd>⌕</kbd>
                  </label>
                </div>
                <div className="player-table">
                  <table>
                    <thead>
                      <tr>
                        <th>RANK</th>
                        <th>PLAYER</th>
                        <th>POS</th>
                        <th>PROJ. PTS</th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((p) => (
                        <tr key={p.id} data-testid={`player-${p.id}`}>
                          <td className="rank">
                            {String(p.rank).padStart(2, "0")}
                          </td>
                          <td>
                            <div className="player-identity">
                              <span className={`avatar pos-${p.position}`}>
                                {p.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </span>
                              <div>
                                <strong>{p.name}</strong>
                                <small>
                                  {p.team}{" "}
                                  <span>
                                    ·{" "}
                                    {p.position === "DEF"
                                      ? "Team defense"
                                      : "Football"}
                                  </span>
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`position pos-${p.position}`}>
                              {p.position}
                            </span>
                          </td>
                          <td className="points">
                            {p.points}
                            <span
                              className="mini-bar"
                              style={{ "--bar": `${(p.points / 360) * 100}%` }}
                            />
                          </td>
                          <td>
                            <div className="row-actions">
                              {human && !paused && (
                                <button
                                  className="draft-pick"
                                  onClick={() => pick(p.id)}
                                  aria-label={`Draft ${p.name}`}
                                >
                                  Draft <ArrowRight size={12} />
                                </button>
                              )}
                              <button
                                className={`queue-add ${queue.includes(p.id) ? "in-queue" : ""}`}
                                aria-label={`${queue.includes(p.id) ? "Remove" : "Queue"} ${p.name}`}
                                onClick={() => queuePlayer(p.id)}
                              >
                                {queue.includes(p.id) ? (
                                  <Check size={15} />
                                ) : (
                                  <Plus size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!displayed.length && (
                    <div className="empty">
                      No players match. Try another name or position.
                    </div>
                  )}
                </div>
                <div className="board-footer">
                  <span>
                    <span className="dot" /> {pool.length} available players
                  </span>
                  <span>
                    Ranked by positional draft value <ArrowDown size={12} />
                  </span>
                </div>
              </section>
              <aside className="sidebar">
                <section
                  className={`clock-panel ${human ? "human-clock" : ""}`}
                >
                  <div className="clock-label">
                    <span>
                      <span className="dot" />
                      {paused
                        ? "ROOM PAUSED"
                        : active
                          ? human
                            ? "YOUR PICK"
                            : "GM ON THE CLOCK"
                          : "READY WHEN YOU ARE"}
                    </span>
                    <span>
                      R{round} / {config.rounds}
                    </span>
                  </div>
                  <div
                    className="clock-face"
                    role="timer"
                    aria-label="Pick clock"
                    data-testid="clock"
                  >
                    00:
                    {String(active ? seconds : config.clock).padStart(2, "0")}
                  </div>
                  <div className="clock-track">
                    <span
                      style={{
                        width: `${((active ? seconds : config.clock) / config.clock) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>
                    {!active
                      ? "Make your next draft your best."
                      : human
                        ? "Your franchise. Your call."
                        : teamNames[current] + " is thinking…"}
                  </strong>
                  <p>
                    {!active
                      ? "Your seat is #1. The board is yours."
                      : human
                        ? "Pick a player or draft the top of your queue."
                        : nextHuman >= 0
                          ? `You’re up in ${nextHuman} pick${nextHuman === 1 ? "" : "s"}. Build your queue.`
                          : "Your roster is complete. Watch the final picks."}
                  </p>
                  <small>
                    {active
                      ? "Clock expiry drafts the best needs-adjusted player."
                      : "A real clock. Real decisions. Zero stakes."}
                  </small>
                </section>
                <section className="panel queue-panel">
                  <div className="panel-heading">
                    <h2>
                      Your queue <span className="count">{queued.length}</span>
                    </h2>
                    <Layers size={16} />
                  </div>
                  <p className="queue-hint">
                    Your shortlist. Drag to set your priority.
                  </p>
                  <div className="queue-list" data-testid="queue">
                    {queued.length ? (
                      queued.map((p, i) => (
                        <div
                          className="queue-item"
                          draggable
                          key={p.id}
                          data-testid={`queue-${p.id}`}
                          onDragStart={(e) => {
                            dragId.current = p.id;
                            e.dataTransfer.setData("text/plain", p.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setQueue((q) => reorder(q, dragId.current, p.id));
                          }}
                        >
                          <GripVertical size={15} />
                          <span className="queue-number">{i + 1}</span>
                          <div>
                            <strong>{p.name}</strong>
                            <small>
                              <span className={`text-${p.position}`}>
                                {p.position}
                              </span>{" "}
                              · {p.team}
                            </small>
                          </div>
                          <div className="queue-actions">
                            <button
                              disabled={i === 0}
                              aria-label={`Move ${p.name} up`}
                              onClick={() =>
                                setQueue((q) =>
                                  reorder(q, p.id, queued[i - 1].id),
                                )
                              }
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              disabled={i === queued.length - 1}
                              aria-label={`Move ${p.name} down`}
                              onClick={() =>
                                setQueue((q) =>
                                  reorder(q, p.id, queued[i + 1].id),
                                )
                              }
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              aria-label={`Remove ${p.name} from queue`}
                              onClick={() => queuePlayer(p.id)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="queue-empty">
                        <Layers size={26} />
                        <strong>Keep your next move close.</strong>
                        <p>Tap + next to a player to add them here.</p>
                      </div>
                    )}
                  </div>
                  <button
                    className="queue-draft"
                    disabled={!human || paused || !queued.length}
                    onClick={() => pick(queued[0].id, "queue")}
                  >
                    Draft top of queue <ArrowRight size={15} />
                  </button>
                </section>
                <section className="activity">
                  <div className="section-label">
                    <span>THE LATEST PICKS</span>
                    <span>
                      LIVE <span className="dot" />
                    </span>
                  </div>
                  {recent.length ? (
                    recent.map((p) => (
                      <div className="activity-row" key={p.id}>
                        <span className={`position pos-${p.position}`}>
                          {p.position}
                        </span>
                        <div>
                          <strong>{p.name}</strong>
                          <small>
                            {teamNames[p.teamIndex]} ·{" "}
                            {p.source === "clock"
                              ? "Clock auto-pick"
                              : `Pick ${p.number}`}
                          </small>
                        </div>
                        <Check size={13} />
                      </div>
                    ))
                  ) : (
                    <div className="activity-empty">
                      The room is quiet. Make the first move.
                    </div>
                  )}
                </section>
              </aside>
            </div>
            <section className="league-section">
              <div className="league-heading">
                <div>
                  <div className="eyebrow">EVERY TEAM. EVERY PICK.</div>
                  <h2>The league board</h2>
                </div>
                <span>
                  {draft?.picks.length ?? 0} / {total} PICKS{" "}
                  <span className="legend-dot" /> YOU
                </span>
              </div>
              <div className="league-grid" style={{ "--teams": config.teams }}>
                {Array.from({ length: config.teams }, (_, i) => (
                  <div
                    className={`roster-card ${i === 0 ? "your-roster" : ""} ${active && current === i ? "active-roster" : ""}`}
                    key={i}
                  >
                    <div className="roster-title">
                      <span className="team-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <strong>
                        {i === 0 ? "Your franchise" : teamNames[i]}
                      </strong>
                      {i === 0 && <span className="you-tag">YOU</span>}
                    </div>
                    <div className="roster-meta">
                      {draft?.rosters[i]?.length ?? 0} PLAYERS{" "}
                      <span>
                        {draft?.rosters[i]?.reduce((s, p) => s + p.points, 0) ??
                          0}{" "}
                        PTS
                      </span>
                    </div>
                    <div className="roster-slots">
                      {Array.from(
                        {
                          length: Math.max(
                            config.rounds,
                            draft?.rosters[i]?.length ?? 0,
                          ),
                        },
                        (_, j) => {
                          const p = draft?.rosters[i]?.[j];
                          return (
                            <div
                              className={`roster-slot ${p ? "filled" : ""}`}
                              key={j}
                            >
                              {p ? (
                                <>
                                  <span
                                    className={`position pos-${p.position}`}
                                  >
                                    {p.position}
                                  </span>
                                  <span title={p.name}>{p.name}</span>
                                </>
                              ) : (
                                <>
                                  <span className="slot-index">
                                    {String(j + 1).padStart(2, "0")}
                                  </span>
                                  <span>Awaiting pick</span>
                                </>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        <footer>
          <span className="footer-brand">
            D↗ <strong>DraftRoom</strong>
            <span>Practice makes a contender.</span>
          </span>
          <span>
            Built for the love of the draft. <i /> No live data. No accounts.
            Just football.
          </span>
          <button onClick={() => setModal("about")}>
            How it works <ChevronRight size={13} />
          </button>
        </footer>
      </main>
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "settings"
                ? "League settings"
                : modal === "pro"
                  ? "Demo Pro"
                  : modal === "history"
                    ? "Draft history"
                    : "How it works"
            }
            onKeyDown={(e) => {
              if (e.key === "Escape") setModal(null);
              if (e.key === "Tab") {
                const nodes = [
                  ...e.currentTarget.querySelectorAll("button,input,select"),
                ].filter((n) => !n.disabled);
                const first = nodes[0],
                  last = nodes.at(-1);
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              autoFocus
              className="modal-close"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {modal === "settings" && (
              <>
                <div className="eyebrow">SET THE STAGE</div>
                <h2>Your league. Your rules.</h2>
                <p>Choose your practice conditions. You draft from seat #1.</p>
                <div className="settings-grid">
                  <label>
                    League size
                    <select
                      aria-label="League size"
                      value={config.teams}
                      onChange={(e) =>
                        setConfig({ ...config, teams: +e.target.value })
                      }
                    >
                      {Array.from({ length: 13 }, (_, i) => i + 4).map((n) => (
                        <option key={n} value={n} disabled={!pro && n !== 8}>
                          {n} teams{n !== 8 && !pro ? " · Pro" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Rounds
                    <select
                      aria-label="Rounds"
                      value={config.rounds}
                      onChange={(e) =>
                        setConfig({ ...config, rounds: +e.target.value })
                      }
                    >
                      {[1, 3, 5, 10, 15, 20].map((n) => (
                        <option key={n} value={n}>
                          {n} rounds{n === 15 ? " · Full roster" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Pick clock
                    <select
                      aria-label="Pick clock"
                      value={config.clock}
                      onChange={(e) =>
                        setConfig({ ...config, clock: +e.target.value })
                      }
                    >
                      {[15, 30, 45, 60].map((n) => (
                        <option key={n} value={n}>
                          {n} seconds
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Format
                    <select
                      disabled={!pro}
                      value={config.keeper ? "keeper" : "redraft"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          keeper: e.target.value === "keeper",
                        })
                      }
                    >
                      <option value="redraft">Redraft</option>
                      <option value="keeper">Dynasty / keeper</option>
                    </select>
                  </label>
                </div>
                {config.keeper && (
                  <p className="info-box">
                    {keepers.length
                      ? "Two highest-value players per team will carry forward as bonus keepers."
                      : "This is your first keeper season. Complete it to carry two players per team into the next draft."}{" "}
                    Your configured rounds are additional picks.
                  </p>
                )}
                <div className="weights-heading">
                  <h3>Opponent position weights</h3>
                  <span className="pro-badge">PRO</span>
                </div>
                <p>
                  Balanced AI by default. Change how much opponents value each
                  position.
                </p>
                <div className="weight-grid">
                  {positions.map((p) => (
                    <label key={p}>
                      {p}
                      <input
                        aria-label={`${p} weight`}
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        disabled={!pro}
                        value={weights[p]}
                        onChange={(e) =>
                          setWeights({ ...weights, [p]: +e.target.value })
                        }
                      />
                      <output>{weights[p].toFixed(1)}×</output>
                    </label>
                  ))}
                </div>
                <button className="primary full" onClick={() => setModal(null)}>
                  Save league settings <Check size={16} />
                </button>
              </>
            )}
            {modal === "pro" && (
              <>
                <div className="eyebrow">
                  <Zap size={15} /> A BIGGER PLAYBOOK
                </div>
                <h2>
                  {pro
                    ? "Welcome to Demo Pro."
                    : "More reps. More possibilities."}
                </h2>
                <p>
                  A self-issuable demo license unlocks the full practice room.
                  No payment or account required.
                </p>
                <div className="pro-features">
                  {[
                    "Unlimited drafts, every day",
                    "Custom leagues: 4–16 teams",
                    "Keeper seasons: carry your core forward",
                    "Draft history & opponent scoring weights",
                  ].map((t) => (
                    <div key={t}>
                      <Check size={17} />
                      {t}
                    </div>
                  ))}
                </div>
                {!pro && (
                  <>
                    <button
                      className="primary full"
                      onClick={async () => activate(await generateLicense())}
                    >
                      <Zap size={16} /> Activate free demo license
                    </button>
                    <div className="divider">OR USE A LICENSE KEY</div>
                    <label className="license-label">
                      Demo license key
                      <input
                        placeholder="DR1.…"
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                      />
                    </label>
                    <button
                      className="secondary full"
                      onClick={() => activate()}
                    >
                      Verify & activate
                    </button>
                  </>
                )}
                <p className="fineprint">
                  HMAC-SHA-256 verification with a deliberately public demo
                  secret. This is a billing prototype, not a paid checkout.
                  Free: one 8-team draft per local calendar day, basic AI, no
                  history.
                </p>
                {message && <p role="status">{message}</p>}
              </>
            )}
            {modal === "history" && (
              <>
                <div className="eyebrow">THE FILM ROOM</div>
                <h2>Your draft history</h2>
                <p>Your last 20 completed Pro drafts, saved in this browser.</p>
                {history.length ? (
                  history.map((h, i) => {
                    const g = gradeTeam(
                      h.picks.filter((p) => p.teamIndex === 0),
                    );
                    return (
                      <button
                        className="history-row"
                        key={i}
                        onClick={() => {
                          setPast(h);
                          setModal(null);
                        }}
                      >
                        <span className="history-grade">{g.letter}</span>
                        <div>
                          <strong>
                            {h.config.teams}-team{" "}
                            {h.config.keeper ? "keeper" : "redraft"} ·{" "}
                            {h.config.rounds} rounds
                          </strong>
                          <small>
                            {new Date(h.finishedAt).toLocaleString()}
                          </small>
                        </div>
                        <ArrowRight size={17} />
                      </button>
                    );
                  })
                ) : (
                  <div className="empty">
                    Finish a draft with Demo Pro to start your collection.
                  </div>
                )}
              </>
            )}
            {modal === "about" && (
              <>
                <div className="eyebrow">THE PLAYBOOK</div>
                <h2>A practice room with a pulse.</h2>
                <p>
                  Pick order snakes forward, then backward each round. You own
                  seat #1. Opponents pick automatically; the visible clock
                  auto-picks for you when it expires.
                </p>
                <h3>How the GMs think</h3>
                <p>
                  Players have illustrative positional draft values, separate
                  from raw PPR points. AI multiplies value by positional need:
                  1.12× for an empty position, 0.86× for depth, and 0.12× or
                  less once its target is filled (2 QB, 5 RB, 5 WR, 1 TE, 1 K, 1
                  DEF). Pro weights adjust these preferences.
                </p>
                <h3>What your grade means</h3>
                <p>
                  Each pick earns its needs-adjusted value divided by the best
                  available needs-adjusted value at that moment, capped at 100%.
                  The average gives A ≥93, B ≥83, C ≥73, D ≥60, otherwise F.
                  Grades always use baseline weights, so changing your
                  opponents’ preferences does not change the yardstick.
                </p>
                <h3>Your data stays here</h3>
                <p>
                  {players.length} real player and defense names, historical
                  club associations, and invented projections are bundled
                  locally. They are practice inputs, not current rankings. No
                  external data requests, accounts, or telemetry. Reloading
                  clears an unfinished draft; completed Pro drafts stay in this
                  browser.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function Results({ draft, onNew, onKeeper, pro }) {
  const grades = draft.rosters.map((r, i) => ({
    ...gradeTeam(draft.picks.filter((p) => p.teamIndex === i)),
    name: teamNames[i],
    points: r.reduce((s, p) => s + p.points, 0),
    i,
  }));
  const mine = grades[0];
  return (
    <div className="results">
      <section className="result-hero">
        <div className="grade-orb" data-testid="your-grade">
          {mine.letter}
          <span>{mine.score}/100 VALUE</span>
        </div>
        <div>
          <div className="eyebrow">
            <Trophy size={17} /> YOUR DRAFT REPORT
          </div>
          <h2>
            {mine.score >= 83
              ? "That’s a contender."
              : "Every draft is a lesson."}
          </h2>
          <p>{mine.explanation}</p>
          <div className="result-stats">
            <span>
              <strong>{draft.rosters[0].length}</strong>PLAYERS
            </span>
            <span>
              <strong>{mine.points.toLocaleString()}</strong>PROJECTED PTS
            </span>
            <span>
              <strong>
                #
                {[...grades]
                  .sort((a, b) => b.score - a.score || a.i - b.i)
                  .findIndex((g) => g.i === 0) + 1}
              </strong>
              VALUE RANK
            </span>
          </div>
        </div>
        <div className="result-actions">
          <button className="primary" onClick={onNew}>
            <RotateCcw size={16} /> New draft
          </button>
          {pro && (
            <button className="secondary" onClick={onKeeper}>
              Next keeper season <ArrowRight size={15} />
            </button>
          )}
        </div>
      </section>
      <p className="grade-method">
        GRADING PLAYBOOK{" "}
        <span>
          Average pick value ÷ best needs-adjusted value available. A ≥93 · B
          ≥83 · C ≥73 · D ≥60 · F &lt;60. Keepers excluded. Practice grades, not
          predictions.
        </span>
      </p>
      <div className="result-grid">
        {grades.map((g) => (
          <section
            className={`panel result-team ${g.i === 0 ? "mine" : ""}`}
            key={g.i}
          >
            <div className="result-team-head">
              <div>
                <span className="eyebrow">
                  {g.i === 0 ? "YOUR FRANCHISE" : `TEAM ${g.i + 1}`}
                </span>
                <h3>{g.name}</h3>
              </div>
              <span className="letter-grade">
                {g.letter}
                <small>{g.score}/100</small>
              </span>
            </div>
            <p>{g.explanation}</p>
            {draft.rosters[g.i].map((p) => (
              <div className="result-player" key={p.id}>
                <span className={`position pos-${p.position}`}>
                  {p.position}
                </span>
                <strong>{p.name}</strong>
                <span>{p.points}</span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
