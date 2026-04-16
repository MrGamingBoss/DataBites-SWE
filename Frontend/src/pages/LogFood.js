// LogFood.js
// Food logging page — lets users log meals, mood, and notes.
// PBI #2 - Log food entries
// PBI #3 - Meal context: meal_type, mood, notes

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:5000";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "other"];
const MOODS = [
  "happy", "satisfied", "hungry", "craving", "indulgent",
  "energized", "sluggish", "nostalgic", "comforted", "adventurous",
  "bored", "stressed", "tired", "sad"
];

const MEAL_ICONS = {
  breakfast: "🍳",
  lunch: "🥪",
  dinner: "🍽️",
  snack: "🍎",
  other: "🍴",
};

const MOOD_ICONS = {
  happy: "😊", satisfied: "😌", hungry: "🤤", craving: "😋",
  indulgent: "🧁", energized: "⚡", sluggish: "😴", nostalgic: "🌸",
  comforted: "🫂", adventurous: "🌟", bored: "😐", stressed: "😤",
  tired: "😪", sad: "🥺",
};

function getDefaultDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "Now";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RecentEntry({ log }) {
  if (!log) {
    return <p style={styles.empty}>Your most recent saved meal will appear here after your first log ✨</p>;
  }
  return (
    <div>
      <p style={styles.foodName}>{log.food_name}</p>
      <p style={styles.timestamp}>{formatDateTime(log.logged_at)}</p>
      <div style={styles.tags}>
        {log.meal_type && (
          <span style={styles.tagGreen}>
            {MEAL_ICONS[log.meal_type]} {log.meal_type}
          </span>
        )}
        {log.mood && (
          <span style={styles.tagSage}>
            {MOOD_ICONS[log.mood]} {log.mood}
          </span>
        )}
      </div>
      {log.notes && <p style={styles.notes}>"{log.notes}"</p>}
    </div>
  );
}

export default function LogFood() {
  const navigate = useNavigate();
  const user    = JSON.parse(localStorage.getItem("user") || "{}");
  const user_id = user.user_id;

  const [form, setForm] = useState({
    food_name: "",
    logged_at: getDefaultDateTime(),
    meal_type: "lunch",
    mood:      "happy",
    notes:     "",
  });
  const [message,      setMessage]      = useState("");
  const [messageType,  setMessageType]  = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [lastSavedLog, setLastSavedLog] = useState(null);
  const [toast,        setToast]        = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user_id) navigate("/");
  }, [user_id]);

  if (!user_id) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function showToast(msg, type = "success") {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/log_food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          food_name: form.food_name.trim(),
          logged_at: form.logged_at ? new Date(form.logged_at).toISOString() : undefined,
          meal_type: form.meal_type || null,
          mood:      form.mood.trim().toLowerCase() || null,
          notes:     form.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your log.");

      setLastSavedLog(data.log);
      setMessage(data.message || "Food logged successfully.");
      setMessageType("success");
      showToast("Food logged! 🌿");
      setForm({
        food_name: "",
        logged_at: getDefaultDateTime(),
        meal_type: form.meal_type,
        mood:      form.mood,
        notes:     "",
      });
    } catch (err) {
      setMessage(err.message || "Could not connect to server.");
      setMessageType("error");
      showToast(err.message || "Could not connect to server.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.titleRow}>
            <span style={styles.titleIcon}>🥗</span>
            <h1 style={styles.title}>Log Food</h1>
          </div>
          <p style={styles.subtitle}>Track what you ate, how you felt, and when it happened</p>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.navBtn} onClick={() => navigate("/history")}>📋 History</button>
          <button style={styles.navBtn} onClick={() => navigate("/insights")}>✨ Insights</button>
          <button style={styles.ghostBtn} onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#d97b6c" : "#91ab6f" }}>
          {toast.message}
        </div>
      )}

      {/* Form card */}
      <div style={styles.card}>
        <p style={styles.cardTitle}>🌱 New entry</p>

        <form onSubmit={handleSubmit}>

          <label style={styles.label}>Food name</label>
          <input
            name="food_name"
            value={form.food_name}
            onChange={handleChange}
            placeholder="Ex. turkey sandwich, yogurt parfait, iced coffee..."
            required
            style={styles.input}
          />

          <label style={styles.label}>Date and time</label>
          <input
            type="datetime-local"
            name="logged_at"
            value={form.logged_at}
            onChange={handleChange}
            style={styles.input}
          />

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Meal type</label>
              <select name="meal_type" value={form.meal_type} onChange={handleChange} style={styles.input}>
                {MEAL_TYPES.map(m => <option key={m} value={m}>{MEAL_ICONS[m]} {m}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, marginLeft: 10 }}>
              <label style={styles.label}>Mood</label>
              <select name="mood" value={form.mood} onChange={handleChange} style={styles.input}>
                {MOODS.map(m => <option key={m} value={m}>{MOOD_ICONS[m]} {m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <p style={styles.label}>Quick meal picks</p>
            <div style={styles.chipRow}>
              {MEAL_TYPES.map(m => (
                <button
                  key={m}
                  type="button"
                  style={form.meal_type === m ? styles.chipActive : styles.chip}
                  onClick={() => setForm(prev => ({ ...prev, meal_type: m }))}
                >
                  {MEAL_ICONS[m]} {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <p style={styles.label}>Mood shortcuts</p>
            <div style={styles.chipRow}>
              {MOODS.map(m => (
                <button
                  key={m}
                  type="button"
                  style={form.mood === m ? styles.chipActive : styles.chip}
                  onClick={() => setForm(prev => ({ ...prev, mood: m }))}
                >
                  {MOOD_ICONS[m]} {m}
                </button>
              ))}
            </div>
          </div>

          <label style={styles.label}>Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Anything useful to remember? Location, portion, cravings, context..."
            style={{ ...styles.input, resize: "none" }}
          />

          {message && (
            <div style={{
              ...styles.messageBanner,
              backgroundColor: messageType === "success" ? "#eef4e5" : "#fce8e4",
              color:           messageType === "success" ? "#4a7c2f"  : "#c0392b",
              border:          `1px solid ${messageType === "success" ? "#c8d7b0" : "#f5c2bb"}`,
            }}>
              {message}
            </div>
          )}

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? "Saving... 🌿" : "Save food log 🌿"}
          </button>

        </form>
      </div>

      {/* Recent entry snapshot */}
      <div style={styles.card}>
        <p style={styles.cardTitle}>🍀 Last saved</p>
        <RecentEntry log={lastSavedLog} />
      </div>

    </div>
  );
}

const styles = {
  page:          { maxWidth: 680, margin: "0 auto", padding: "32px 16px", fontFamily: "'Instrument Serif', Georgia, serif", backgroundColor: "#fffdf9", minHeight: "100vh" },
  header:        { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  headerRight:   { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  titleRow:      { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  titleIcon:     { fontSize: 28 },
  title:         { fontSize: 30, fontWeight: "bold", color: "#3a5a2a", margin: 0 },
  subtitle:      { fontSize: 14, color: "#8a9e7a", marginTop: 4, marginBottom: 0 },
  navBtn:        { padding: "8px 14px", fontSize: 13, borderRadius: 20, border: "1.5px solid #c8d7b0", backgroundColor: "#f5f9ee", color: "#4a7c2f", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" },
  ghostBtn:      { padding: "8px 14px", fontSize: 13, borderRadius: 20, border: "1.5px solid #e0dbd2", backgroundColor: "#faf8f4", color: "#9a8f82", cursor: "pointer", fontFamily: "inherit" },

  card:          { backgroundColor: "#ffffff", border: "1.5px solid #e8edd8", borderRadius: 18, padding: "20px 22px", marginBottom: 16, boxShadow: "0 2px 12px rgba(100, 130, 60, 0.06)" },
  cardTitle:     { fontSize: 14, fontWeight: "600", color: "#7a9660", margin: "0 0 16px 0" },

  label:         { display: "block", fontSize: 12, color: "#8a9e7a", marginBottom: 5, marginTop: 14, textTransform: "uppercase", letterSpacing: "0.03em" },
  input:         { width: "100%", padding: "9px 12px", fontSize: 14, borderRadius: 12, border: "1.5px solid #dfe8cc", boxSizing: "border-box", outline: "none", fontFamily: "inherit", backgroundColor: "#fafdf5", color: "#3a4a2e", transition: "border-color 0.2s" },
  row:           { display: "flex", gap: 0, marginTop: 0 },

  chipRow:       { display: "flex", flexWrap: "wrap", gap: 7, marginTop: 6 },
  chip:          { padding: "6px 13px", fontSize: 12, borderRadius: 20, border: "1.5px solid #dfe8cc", backgroundColor: "#fafdf5", color: "#6a8a50", cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit", transition: "all 0.15s" },
  chipActive:    { padding: "6px 13px", fontSize: 12, borderRadius: 20, border: "1.5px solid #91ab6f", backgroundColor: "#dfeacc", color: "#3a5a2a", cursor: "pointer", fontWeight: "600", textTransform: "capitalize", fontFamily: "inherit" },

  messageBanner: { padding: "10px 14px", borderRadius: 10, fontSize: 13, marginTop: 14 },
  submitBtn:     { marginTop: 18, width: "100%", padding: "13px", fontSize: 15, fontWeight: "bold", borderRadius: 14, border: "none", backgroundColor: "#91ab6f", color: "#fff", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em", transition: "background-color 0.2s" },

  foodName:      { fontWeight: "bold", fontSize: 17, color: "#3a4a2e", margin: "0 0 6px 0" },
  tags:          { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6, marginTop: 6 },
  tagGreen:      { fontSize: 12, backgroundColor: "#dfeacc", color: "#3a5a2a", borderRadius: 20, padding: "3px 11px", border: "1px solid #c8d7b0" },
  tagSage:       { fontSize: 12, backgroundColor: "#eef2e8", color: "#5a7a40", borderRadius: 20, padding: "3px 11px", border: "1px solid #d0dcc0" },
  notes:         { fontSize: 13, color: "#8a9e7a", fontStyle: "italic", margin: "6px 0 0" },
  timestamp:     { fontSize: 12, color: "#b5b0a5", margin: "2px 0" },
  empty:         { textAlign: "center", color: "#c5bfb5", fontSize: 14, padding: "14px 0", margin: 0 },

  toast:         { position: "fixed", top: 20, right: 20, padding: "12px 20px", borderRadius: 14, color: "#fff", fontWeight: "bold", fontSize: 14, zIndex: 1000, boxShadow: "0 4px 16px rgba(100,130,60,0.2)", fontFamily: "inherit" },
};