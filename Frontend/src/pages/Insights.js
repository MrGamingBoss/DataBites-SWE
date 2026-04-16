// Insights.js
// Habit summaries and eating pattern insights for the user.
// PBI #4 - View weekly and monthly food log trends with generated summaries

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:5000";

const MOOD_COLORS = {
  happy:       { bg: "#dfeacc", color: "#3a5a2a" },
  satisfied:   { bg: "#e8f2dc", color: "#4a6a30" },
  hungry:      { bg: "#fce8dc", color: "#9a4020" },
  craving:     { bg: "#fce8f0", color: "#8a2050" },
  indulgent:   { bg: "#fef5d8", color: "#8a6010" },
  energized:   { bg: "#dff0fa", color: "#1a5a8a" },
  sluggish:    { bg: "#eeede8", color: "#5a5a50" },
  nostalgic:   { bg: "#faeaf5", color: "#7a2060" },
  comforted:   { bg: "#fef3d8", color: "#8a5010" },
  adventurous: { bg: "#d8f0e8", color: "#1a6a4a" },
  bored:       { bg: "#f2f0ec", color: "#6a6a60" },
  stressed:    { bg: "#fce8e8", color: "#9a2020" },
  tired:       { bg: "#ede8fa", color: "#5a3a8a" },
  sad:         { bg: "#deeefa", color: "#1a508a" },
};

const MOOD_ICONS = {
  happy: "😊", satisfied: "😌", hungry: "🤤", craving: "😋",
  indulgent: "🧁", energized: "⚡", sluggish: "😴", nostalgic: "🌸",
  comforted: "🫂", adventurous: "🌟", bored: "😐", stressed: "😤",
  tired: "😪", sad: "🥺",
};

const TIME_SLOTS = [
  { key: "morning",   label: "Morning",   icon: "🌅", hours: "5am–11am"  },
  { key: "midday",    label: "Midday",    icon: "☀️",  hours: "12pm–2pm"  },
  { key: "afternoon", label: "Afternoon", icon: "🌤️", hours: "3pm–5pm"   },
  { key: "evening",   label: "Evening",   icon: "🌙", hours: "6pm–late"  },
];

// -------------------------------------------------------------------
// StatCard
// -------------------------------------------------------------------
function StatCard({ label, value, sub, icon }) {
  return (
    <div style={styles.statCard}>
      {icon && <p style={styles.statIcon}>{icon}</p>}
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value ?? "—"}</p>
      {sub && <p style={styles.statSub}>{sub}</p>}
    </div>
  );
}

// -------------------------------------------------------------------
// MoodBar
// -------------------------------------------------------------------
function MoodBar({ mood, count, max }) {
  const pct  = max > 0 ? Math.round((count / max) * 100) : 0;
  const meta = MOOD_COLORS[mood] || { bg: "#f2f0ec", color: "#6a6a60" };
  return (
    <div style={styles.moodRow}>
      <span style={styles.moodLabel}>
        {MOOD_ICONS[mood] || "😊"} {mood}
      </span>
      <div style={styles.moodTrack}>
        <div style={{ ...styles.moodFill, width: `${pct}%`, backgroundColor: meta.color }} />
      </div>
      <span style={{ ...styles.moodBadge, backgroundColor: meta.bg, color: meta.color }}>{count}</span>
    </div>
  );
}

// -------------------------------------------------------------------
// TimeGrid
// -------------------------------------------------------------------
function TimeGrid({ data }) {
  const map     = Object.fromEntries(data.map(d => [d.time_slot, d.count]));
  const maxSlot = data.reduce((best, d) => (d.count > (map[best] || 0) ? d.time_slot : best), "");

  return (
    <div style={styles.timeGrid}>
      {TIME_SLOTS.map(slot => {
        const active = slot.key === maxSlot;
        return (
          <div key={slot.key} style={{ ...styles.timeSlot, ...(active ? styles.timeSlotActive : {}) }}>
            <span style={styles.timeIcon}>{slot.icon}</span>
            <span style={{ ...styles.timeLabel, color: active ? "#3a5a2a" : "#8a9e7a" }}>
              {slot.label}
            </span>
            <span style={{ ...styles.timeCount, color: active ? "#3a5a2a" : "#3a4a2e" }}>
              {map[slot.key] ?? 0}
            </span>
            <span style={styles.timeHours}>{slot.hours}</span>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------
// TrendChart — SVG bar chart
// -------------------------------------------------------------------
function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p style={styles.empty}>No trend data for this period.</p>;
  }

  const W = 560, H = 100, pad = { left: 8, right: 8, top: 8, bottom: 24 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max    = Math.max(...data.map(d => d.count), 1);
  const barW   = Math.max(8, (innerW / data.length) - 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", overflow: "visible" }} role="img"
      aria-label={`Bar chart showing meal log counts: ${data.map(d => `${d.label}: ${d.count}`).join(", ")}`}>
      {data.map((d, i) => {
        const x   = pad.left + i * (innerW / data.length) + (innerW / data.length - barW) / 2;
        const barH = Math.max(4, (d.count / max) * innerH);
        const y   = pad.top + innerH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="6" fill="#91ab6f" />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle"
              style={{ fontSize: 9, fill: "#b5b0a5", fontFamily: "inherit" }}>
              {d.label.length > 6 ? d.label.slice(5) : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// -------------------------------------------------------------------
// SummaryBlurb
// -------------------------------------------------------------------
function SummaryBlurb({ text, generatedAt }) {
  if (!text) return null;
  return (
    <div style={styles.blurb}>
      <p style={styles.blurbTag}>🌿 Weekly reflection</p>
      <p style={styles.blurbText}>{text}</p>
      {generatedAt && (
        <p style={styles.blurbMeta}>
          Generated {new Date(generatedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Insights — main page component
// -------------------------------------------------------------------
export default function Insights() {
  const navigate = useNavigate();

  const user    = JSON.parse(localStorage.getItem("user") || "{}");
  const user_id = user.user_id;

  const [period,    setPeriod]    = useState("weekly");
  const [summary,   setSummary]   = useState(null);
  const [moods,     setMoods]     = useState([]);
  const [timeOfDay, setTimeOfDay] = useState([]);
  const [topMeals,  setTopMeals]  = useState([]);
  const [trend,     setTrend]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [toast,     setToast]     = useState(null);

  useEffect(() => { if (user_id) fetchAll(); }, [user_id, period]);

  async function fetchAll() {
    setLoading(true); setError(null);
    try {
      const params = `user_id=${user_id}&period=${period}`;
      const [sumRes, moodRes, timeRes, mealsRes, trendRes] = await Promise.all([
        fetch(`${API_BASE}/insights/summary?${params}`),
        fetch(`${API_BASE}/insights/mood?${params}`),
        fetch(`${API_BASE}/insights/time-of-day?${params}`),
        fetch(`${API_BASE}/insights/top-meals?${params}&limit=5`),
        fetch(`${API_BASE}/insights/trend?${params}`),
      ]);

      if (!sumRes.ok || !moodRes.ok || !timeRes.ok || !mealsRes.ok || !trendRes.ok) {
        throw new Error("One or more insight requests failed.");
      }

      const [sumData, moodData, timeData, mealsData, trendData] = await Promise.all([
        sumRes.json(), moodRes.json(), timeRes.json(), mealsRes.json(), trendRes.json(),
      ]);

      setSummary(sumData);
      setMoods(moodData);
      setTimeOfDay(timeData);
      setTopMeals(mealsData);
      setTrend(trendData);
    } catch (e) {
      setError("Could not load insights. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      const res = await fetch(`${API_BASE}/insights/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, period }),
      });
      if (!res.ok) throw new Error();
      showToast("Summary refreshed! 🌿");
      fetchAll();
    } catch {
      showToast("Failed to refresh summary.", "error");
    }
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const maxMood = moods.length > 0 ? Math.max(...moods.map(m => m.count)) : 1;

  if (!user_id) {
    return <p style={styles.centerText}>Please log in to view your insights.</p>;
  }

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.titleRow}>
            <span style={styles.titleIcon}>✨</span>
            <h1 style={styles.title}>Insights</h1>
          </div>
          <p style={styles.subtitle}>Reflect on your eating patterns over time</p>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.navBtn} onClick={() => navigate("/home")}>🏡 Home</button>
          <button style={styles.navBtn} onClick={() => navigate("/history")}>📋 History</button>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={styles.select}
          >
            <option value="weekly">🗓️ This week</option>
            <option value="monthly">📅 This month</option>
          </select>
          <button style={styles.refreshBtn} onClick={handleRefresh}>↻ Refresh</button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#d97b6c" : "#91ab6f" }}>
          {toast.message}
        </div>
      )}

      {loading && <p style={styles.centerText}>Loading your insights... 🌿</p>}
      {!loading && error && <p style={{ ...styles.centerText, color: "#d97b6c" }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* Stat row */}
          <div style={styles.statRow}>
            <StatCard
              icon="🍽️"
              label="Meals logged"
              value={summary?.total_entries ?? 0}
              sub={`this ${period === "weekly" ? "week" : "month"}`}
            />
            <StatCard
              icon="📆"
              label="Active days"
              value={summary?.days_logged ?? 0}
              sub={period === "weekly" ? "out of 7" : "out of 30"}
            />
            <StatCard
              icon="🍴"
              label="Top meal type"
              value={summary?.most_common_meal_type ?? "—"}
            />
            <StatCard
              icon="💚"
              label="Top mood"
              value={summary?.most_common_mood ?? "—"}
            />
          </div>

          {/* Trend chart */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>📈 Log activity — {period === "weekly" ? "this week" : "this month"}</p>
            <TrendChart data={trend} />
          </div>

          {/* Mood breakdown */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>💚 Mood when eating</p>
            {moods.length === 0
              ? <p style={styles.empty}>No mood data logged yet.</p>
              : moods.map(m => (
                  <MoodBar key={m.mood} mood={m.mood} count={m.count} max={maxMood} />
                ))
            }
          </div>

          {/* Time of day */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>🕐 When you typically eat</p>
            <TimeGrid data={timeOfDay} />
          </div>

          {/* Top meals */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>⭐ Most frequent meals</p>
            {topMeals.length === 0
              ? <p style={styles.empty}>No meals logged yet.</p>
              : (
                <div style={styles.chipRow}>
                  {topMeals.map(m => (
                    <span key={m.food_name} style={styles.chip}>
                      {m.food_name}
                      <span style={styles.chipBadge}>{m.count}×</span>
                    </span>
                  ))}
                </div>
              )
            }
          </div>

          {/* Generated summary */}
          <SummaryBlurb text={summary?.summary_notes} generatedAt={summary?.generated_at} />
        </>
      )}
    </div>
  );
}

const styles = {
  page:           { maxWidth: 680, margin: "0 auto", padding: "32px 16px", fontFamily: "'Instrument Serif', Georgia, serif", backgroundColor: "#fffdf9", minHeight: "100vh" },
  header:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  headerRight:    { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  titleRow:       { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  titleIcon:      { fontSize: 28 },
  title:          { fontSize: 30, fontWeight: "bold", color: "#3a5a2a", margin: 0 },
  subtitle:       { fontSize: 14, color: "#8a9e7a", marginTop: 4, marginBottom: 0 },
  navBtn:         { padding: "8px 14px", fontSize: 13, borderRadius: 20, border: "1.5px solid #c8d7b0", backgroundColor: "#f5f9ee", color: "#4a7c2f", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" },
  select:         { padding: "8px 12px", fontSize: 13, borderRadius: 20, border: "1.5px solid #c8d7b0", backgroundColor: "#f5f9ee", color: "#4a7c2f", cursor: "pointer", outline: "none", fontFamily: "inherit" },
  refreshBtn:     { padding: "8px 14px", fontSize: 13, borderRadius: 20, border: "1.5px solid #dfe8cc", backgroundColor: "#fafdf5", color: "#7a9660", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" },

  statRow:        { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 },
  statCard:       { backgroundColor: "#f5f9ee", borderRadius: 14, padding: "14px 14px", border: "1.5px solid #e8edd8", textAlign: "center" },
  statIcon:       { fontSize: 20, margin: "0 0 4px 0" },
  statLabel:      { fontSize: 11, color: "#8a9e7a", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px 0" },
  statValue:      { fontSize: 22, fontWeight: "bold", color: "#3a5a2a", margin: "0 0 2px 0", textTransform: "capitalize" },
  statSub:        { fontSize: 12, color: "#b5b0a5", margin: 0 },

  card:           { backgroundColor: "#ffffff", border: "1.5px solid #e8edd8", borderRadius: 16, padding: "18px 20px", marginBottom: 14, boxShadow: "0 2px 10px rgba(100,130,60,0.05)" },
  cardTitle:      { fontSize: 13, fontWeight: "600", color: "#7a9660", margin: "0 0 14px 0" },

  moodRow:        { display: "flex", alignItems: "center", gap: 8, marginBottom: 9 },
  moodLabel:      { fontSize: 13, color: "#5a6a50", width: 100, flexShrink: 0, textTransform: "capitalize" },
  moodTrack:      { flex: 1, backgroundColor: "#f2f0ec", borderRadius: 6, height: 14, overflow: "hidden" },
  moodFill:       { height: "100%", borderRadius: 6, transition: "width 0.4s ease" },
  moodBadge:      { fontSize: 12, borderRadius: 12, padding: "2px 9px", fontWeight: "600", minWidth: 28, textAlign: "center", border: "1px solid rgba(0,0,0,0.06)" },

  timeGrid:       { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  timeSlot:       { backgroundColor: "#fafdf5", borderRadius: 12, padding: "12px 6px", textAlign: "center", border: "1.5px solid #e8edd8" },
  timeSlotActive: { backgroundColor: "#dfeacc", border: "1.5px solid #c8d7b0" },
  timeIcon:       { fontSize: 18, display: "block", marginBottom: 4 },
  timeLabel:      { fontSize: 11, display: "block", marginBottom: 3 },
  timeCount:      { fontSize: 20, fontWeight: "bold", display: "block" },
  timeHours:      { fontSize: 10, color: "#b5b0a5", display: "block", marginTop: 3 },

  chipRow:        { display: "flex", flexWrap: "wrap", gap: 8 },
  chip:           { display: "inline-flex", alignItems: "center", gap: 7, backgroundColor: "#f5f9ee", borderRadius: 20, padding: "6px 13px", fontSize: 13, color: "#3a4a2e", border: "1.5px solid #e0e8d0" },
  chipBadge:      { fontSize: 11, backgroundColor: "#dfeacc", color: "#3a5a2a", borderRadius: 12, padding: "2px 8px", fontWeight: "600" },

  blurb:          { backgroundColor: "#f5f9ee", borderRadius: 16, padding: "16px 18px", border: "1.5px solid #dfe8cc" },
  blurbTag:       { fontSize: 12, fontWeight: "600", color: "#7a9660", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px 0" },
  blurbText:      { fontSize: 14, color: "#5a6a50", lineHeight: 1.7, margin: "0 0 8px 0" },
  blurbMeta:      { fontSize: 11, color: "#b5b0a5", margin: 0 },

  centerText:     { textAlign: "center", color: "#b5b0a5", marginTop: 60, fontSize: 15 },
  empty:          { textAlign: "center", color: "#c5bfb5", fontSize: 13, padding: "12px 0", margin: 0 },
  toast:          { position: "fixed", top: 20, right: 20, padding: "12px 20px", borderRadius: 14, color: "#fff", fontWeight: "bold", fontSize: 14, zIndex: 1000, boxShadow: "0 4px 16px rgba(100,130,60,0.2)", fontFamily: "inherit" },
};