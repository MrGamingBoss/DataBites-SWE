// Insights.js
// Habit summaries and eating pattern insights for the user.
// PBI #4 - View weekly and monthly food log trends with generated summaries
// Mirrors the structure and style of History.jsx

import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:5000";

const MOOD_COLORS = {
  happy:       { bg: "#dcfce7", color: "#15803d" },
  satisfied:   { bg: "#d1fae5", color: "#065f46" },
  hungry:      { bg: "#ffedd5", color: "#c2410c" },
  craving:     { bg: "#fce7f3", color: "#be185d" },
  indulgent:   { bg: "#fef9c3", color: "#a16207" },
  energized:   { bg: "#dbeafe", color: "#1d4ed8" },
  sluggish:    { bg: "#e5e7eb", color: "#4b5563" },
  nostalgic:   { bg: "#fdf2f8", color: "#9d174d" },
  comforted:   { bg: "#fef3c7", color: "#92400e" },
  adventurous: { bg: "#d1fae5", color: "#047857" },
  bored:       { bg: "#f3f4f6", color: "#6b7280" },
  stressed:    { bg: "#fee2e2", color: "#dc2626" },
  tired:       { bg: "#ede9fe", color: "#6d28d9" },
  sad:         { bg: "#e0f2fe", color: "#0369a1" },
};

const TIME_SLOTS = [
  { key: "morning",   label: "Morning",   icon: "🌅", hours: "5am–11am"  },
  { key: "midday",    label: "Midday",    icon: "☀️",  hours: "12pm–2pm"  },
  { key: "afternoon", label: "Afternoon", icon: "🌤️", hours: "3pm–5pm"   },
  { key: "evening",   label: "Evening",   icon: "🌙", hours: "6pm–late"  },
];

// -------------------------------------------------------------------
// StatCard — summary number with label
// -------------------------------------------------------------------
function StatCard({ label, value, sub }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value ?? "—"}</p>
      {sub && <p style={styles.statSub}>{sub}</p>}
    </div>
  );
}

// -------------------------------------------------------------------
// MoodBar — horizontal bar for mood breakdown
// -------------------------------------------------------------------
function MoodBar({ mood, count, max }) {
  const pct  = max > 0 ? Math.round((count / max) * 100) : 0;
  const meta = MOOD_COLORS[mood] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <div style={styles.moodRow}>
      <span style={styles.moodLabel}>{mood}</span>
      <div style={styles.moodTrack}>
        <div style={{ ...styles.moodFill, width: `${pct}%`, backgroundColor: meta.color }} />
      </div>
      <span style={{ ...styles.moodBadge, backgroundColor: meta.bg, color: meta.color }}>{count}</span>
    </div>
  );
}

// -------------------------------------------------------------------
// TimeGrid — 4 time-of-day buckets
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
            <span style={{ ...styles.timeLabel, color: active ? "#3c3489" : "var(--color-text-secondary, #888)" }}>
              {slot.label}
            </span>
            <span style={{ ...styles.timeCount, color: active ? "#3c3489" : "#333" }}>
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
// TrendChart — simple SVG bar chart (no external lib needed)
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
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill="#7f77dd" />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle"
              style={{ fontSize: 9, fill: "#aaa", fontFamily: "inherit" }}>
              {d.label.length > 6 ? d.label.slice(5) : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// -------------------------------------------------------------------
// SummaryBlurb — generated text summary card
// -------------------------------------------------------------------
function SummaryBlurb({ text, generatedAt }) {
  if (!text) return null;
  return (
    <div style={styles.blurb}>
      <p style={styles.blurbTag}>Weekly reflection</p>
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
      showToast("Summary refreshed!");
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
          <h1 style={styles.title}>Insights</h1>
          <p style={styles.subtitle}>Reflect on your eating patterns over time</p>
        </div>
        <div style={styles.headerRight}>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={styles.select}
          >
            <option value="weekly">This week</option>
            <option value="monthly">This month</option>
          </select>
          <button style={styles.refreshBtn} onClick={handleRefresh}>↻ Refresh</button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#ef4444" : "#4caf50" }}>
          {toast.message}
        </div>
      )}

      {loading && <p style={styles.centerText}>Loading your insights...</p>}
      {!loading && error && <p style={{ ...styles.centerText, color: "#ef4444" }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* Stat row */}
          <div style={styles.statRow}>
            <StatCard
              label="Meals logged"
              value={summary?.total_entries ?? 0}
              sub={`this ${period === "weekly" ? "week" : "month"}`}
            />
            <StatCard
              label="Active days"
              value={summary?.days_logged ?? 0}
              sub={period === "weekly" ? "out of 7" : "out of 30"}
            />
            <StatCard
              label="Top meal type"
              value={summary?.most_common_meal_type ?? "—"}
            />
            <StatCard
              label="Top mood"
              value={summary?.most_common_mood ?? "—"}
            />
          </div>

          {/* Trend chart */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>Log activity — {period === "weekly" ? "this week" : "this month"}</p>
            <TrendChart data={trend} />
          </div>

          {/* Mood breakdown */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>Mood when eating</p>
            {moods.length === 0
              ? <p style={styles.empty}>No mood data logged yet.</p>
              : moods.map(m => (
                  <MoodBar key={m.mood} mood={m.mood} count={m.count} max={maxMood} />
                ))
            }
          </div>

          {/* Time of day */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>When you typically eat</p>
            <TimeGrid data={timeOfDay} />
          </div>

          {/* Top meals */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>Most frequent meals</p>
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

          {/* Generated summary blurb */}
          <SummaryBlurb text={summary?.summary_notes} generatedAt={summary?.generated_at} />
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Styles — mirrors History.jsx inline style approach
// -------------------------------------------------------------------
const styles = {
  page:            { maxWidth: 680, margin: "0 auto", padding: "32px 16px", fontFamily: "Arial, sans-serif" },
  header:          { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  headerRight:     { display: "flex", gap: 8, alignItems: "center" },
  title:           { fontSize: 28, fontWeight: "bold", color: "#2e4057", margin: 0 },
  subtitle:        { fontSize: 14, color: "#888", marginTop: 4, marginBottom: 0 },
  select:          { padding: "8px 12px", fontSize: 13, borderRadius: 10, border: "1px solid #ddd", backgroundColor: "#fff", color: "#333", cursor: "pointer", outline: "none" },
  refreshBtn:      { padding: "8px 14px", fontSize: 13, borderRadius: 10, border: "1px solid #ddd", backgroundColor: "#fff", color: "#555", cursor: "pointer", fontWeight: "500" },

  statRow:         { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 },
  statCard:        { backgroundColor: "#f9f9f9", borderRadius: 12, padding: "12px 14px", border: "1px solid #efefef" },
  statLabel:       { fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px 0" },
  statValue:       { fontSize: 22, fontWeight: "bold", color: "#2e4057", margin: "0 0 2px 0", textTransform: "capitalize" },
  statSub:         { fontSize: 12, color: "#bbb", margin: 0 },

  card:            { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "16px 18px", marginBottom: 14 },
  cardTitle:       { fontSize: 13, fontWeight: "600", color: "#888", margin: "0 0 14px 0" },

  moodRow:         { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  moodLabel:       { fontSize: 13, color: "#555", width: 60, flexShrink: 0, textTransform: "capitalize" },
  moodTrack:       { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 4, height: 14, overflow: "hidden" },
  moodFill:        { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },
  moodBadge:       { fontSize: 12, borderRadius: 10, padding: "2px 8px", fontWeight: "600", minWidth: 28, textAlign: "center" },

  timeGrid:        { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  timeSlot:        { backgroundColor: "#f9f9f9", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid #efefef" },
  timeSlotActive:  { backgroundColor: "#eeedfe", border: "1px solid #c4c0f5" },
  timeIcon:        { fontSize: 18, display: "block", marginBottom: 4 },
  timeLabel:       { fontSize: 11, display: "block", marginBottom: 2 },
  timeCount:       { fontSize: 18, fontWeight: "bold", display: "block" },
  timeHours:       { fontSize: 10, color: "#bbb", display: "block", marginTop: 2 },

  chipRow:         { display: "flex", flexWrap: "wrap", gap: 8 },
  chip:            { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f3f4f6", borderRadius: 20, padding: "6px 12px", fontSize: 13, color: "#333" },
  chipBadge:       { fontSize: 11, backgroundColor: "#eeedfe", color: "#3c3489", borderRadius: 10, padding: "2px 7px", fontWeight: "600" },

  blurb:           { backgroundColor: "#f5f3ff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e5e0ff" },
  blurbTag:        { fontSize: 11, fontWeight: "600", color: "#7c6fd4", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px 0" },
  blurbText:       { fontSize: 14, color: "#444", lineHeight: 1.65, margin: "0 0 8px 0" },
  blurbMeta:       { fontSize: 11, color: "#bbb", margin: 0 },

  centerText:      { textAlign: "center", color: "#aaa", marginTop: 60, fontSize: 15 },
  empty:           { textAlign: "center", color: "#ccc", fontSize: 13, padding: "12px 0", margin: 0 },
  toast:           { position: "fixed", top: 20, right: 20, padding: "12px 20px", borderRadius: 10, color: "#fff", fontWeight: "bold", fontSize: 14, zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
};
