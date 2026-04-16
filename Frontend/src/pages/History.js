// displays searchable history of past food logs for user review and editing.
// History.js
// Searchable history of past food logs for user review and editing.
// PBI #5 - view, edit, delete, undo food log entries

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:5000";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "other"];
const MOODS = ["happy", "satisfied", "hungry", "craving", "indulgent", "energized", "sluggish", "nostalgic", "comforted", "adventurous", "bored", "stressed", "tired", "sad"];

// formats a datetime string into a readable format
const MEAL_ICONS = {
  breakfast: "🍳", lunch: "🥪", dinner: "🍽️", snack: "🍎", other: "🍴",
};
const MOOD_ICONS = {
  happy: "😊", satisfied: "😌", hungry: "🤤", craving: "😋",
  indulgent: "🧁", energized: "⚡", sluggish: "😴", nostalgic: "🌸",
  comforted: "🫂", adventurous: "🌟", bored: "😐", stressed: "😤",
  tired: "😪", sad: "🥺",
};

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString([], {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

// -------------------------------------------------------------------
// ConfirmModal
// -------------------------------------------------------------------
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <p style={styles.modalText}>{message}</p>
        <div style={styles.modalButtons}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.confirmBtn} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// EditModal
// -------------------------------------------------------------------
function EditModal({ log, onSave, onCancel }) {
  const [form, setForm] = useState({
    food_name: log.food_name || "",
    logged_at: log.logged_at ? log.logged_at.slice(0, 16) : "",
    meal_type: log.meal_type || "",
    mood:      log.mood      || "",
    notes:     log.notes     || "",
  });

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, width: 420 }}>
        <h2 style={styles.modalTitle}>✏️ Edit Entry</h2>

        <label style={styles.label}>Food Name</label>
        <input name="food_name" value={form.food_name} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Date & Time</label>
        <input type="datetime-local" name="logged_at" value={form.logged_at} onChange={handleChange} style={styles.input} />

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Meal Type</label>
            <select name="meal_type" value={form.meal_type} onChange={handleChange} style={styles.input}>
              <option value="">— none —</option>
              {MEAL_TYPES.map(m => <option key={m} value={m}>{MEAL_ICONS[m]} {m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, marginLeft: 10 }}>
            <label style={styles.label}>Mood</label>
            <select name="mood" value={form.mood} onChange={handleChange} style={styles.input}>
              <option value="">— none —</option>
              {MOODS.map(m => <option key={m} value={m}>{MOOD_ICONS[m]} {m}</option>)}
            </select>
          </div>
        </div>

        <label style={styles.label}>Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} style={{ ...styles.input, resize: "none" }} />

        <div style={styles.modalButtons}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.saveBtn} onClick={() => onSave(form)}>Save Changes 🌿</button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// LogCard
// -------------------------------------------------------------------
function LogCard({ log, onEdit, onDelete, onUndo, highlighted }) {
  return (
    <div style={{
      ...styles.card,
      borderColor: highlighted ? "#91ab6f" : "#e8edd8",
      backgroundColor: highlighted ? "#f0f7e6" : "#ffffff",
    }}>
      <div style={styles.cardLeft}>
        <p style={styles.foodName}>{log.food_name}</p>
        <div style={styles.tags}>
          {log.meal_type && (
            <span style={styles.tagGreen}>
              {MEAL_ICONS[log.meal_type] || "🍴"} {log.meal_type}
            </span>
          )}
          {log.mood && (
            <span style={styles.tagSage}>
              {MOOD_ICONS[log.mood] || "😊"} {log.mood}
            </span>
          )}
        </div>
        {log.notes && <p style={styles.notes}>"{log.notes}"</p>}
        <p style={styles.timestamp}>Logged: {formatDate(log.logged_at)}</p>
        {log.last_changed_at && (
          <p style={styles.timestamp}>Last {log.last_action}: {formatDate(log.last_changed_at)}</p>
        )}
      </div>
      <div style={styles.cardButtons}>
        <button style={styles.editBtn}   onClick={() => onEdit(log)}>✏️ Edit</button>
        <button style={styles.deleteBtn} onClick={() => onDelete(log)}>🗑️ Delete</button>
        <button style={styles.undoBtn}   onClick={() => onUndo(log)}>↩️ Undo</button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// History — main page component
// -------------------------------------------------------------------
export default function History() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const user_id = user.user_id;

  const [logs, setLogs]             = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [toast, setToast]           = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [confirmAction, setConfirm] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => { if (user_id) fetchHistory(); }, [user_id]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(logs); return; }
    const q = search.toLowerCase();
    setFiltered(logs.filter(l =>
      l.food_name?.toLowerCase().includes(q) ||
      l.meal_type?.toLowerCase().includes(q) ||
      l.mood?.toLowerCase().includes(q) ||
      l.notes?.toLowerCase().includes(q)
    ));
  }, [search, logs]);

  async function fetchHistory() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/history/${user_id}`);
      if (!res.ok) throw new Error();
      setLogs(await res.json());
    } catch { setError("Could not load your food history. Please try again."); }
    finally { setLoading(false); }
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function highlightCard(log_id) {
    setHighlightedId(log_id);
    setTimeout(() => setHighlightedId(null), 1500);
  }

  function handleEdit(log)   { setConfirm({ type: "edit",   log }); }
  function handleDelete(log) { setConfirm({ type: "delete", log }); }

  function handleConfirm() {
    const { type, log } = confirmAction;
    setConfirm(null);
    if (type === "edit")   setEditingLog(log);
    if (type === "delete") submitDelete(log);
  }

  async function submitEdit(form) {
    const log = editingLog; setEditingLog(null);
    try {
      const res = await fetch(`${API_BASE}/history/${log.log_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, ...form })
      });
      if (!res.ok) throw new Error();
      showToast("Log updated! 🌿");
      highlightCard(log.log_id);
      fetchHistory();
    } catch { showToast("Failed to update log.", "error"); }
  }

  async function submitDelete(log) {
    try {
      const res = await fetch(`${API_BASE}/history/${log.log_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id })
      });
      if (!res.ok) throw new Error();
      setLogs(prev => prev.filter(l => l.log_id !== log.log_id));
      showToast("Log deleted. Use ↩️ Undo to reverse.");
    } catch { showToast("Failed to delete log.", "error"); }
  }

  async function handleUndo(log) {
    try {
      const res = await fetch(`${API_BASE}/history/${log.log_id}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id })
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Nothing to undo.", "error"); return; }
      showToast("Undo successful! 🌿");
      fetchHistory();
    } catch { showToast("Undo failed.", "error"); }
  }

  if (!user_id) return <p style={styles.centerText}>Please log in to view your food history.</p>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.titleRow}>
            <span style={styles.titleIcon}>📋</span>
            <h1 style={styles.title}>Food History</h1>
          </div>
          <p style={styles.subtitle}>View and manage your past food logs</p>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.navBtn} onClick={() => navigate("/home")}>🏡 Home</button>
          <button style={styles.navBtn} onClick={() => navigate("/insights")}>✨ Insights</button>
        </div>
      </div>

      <div style={styles.searchWrapper}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Search by food, meal type, mood, or notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchBar}
        />
      </div>

      {toast && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#d97b6c" : "#91ab6f" }}>
          {toast.message}
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          message={confirmAction.type === "delete"
            ? `Delete "${confirmAction.log.food_name}"? You can undo this.`
            : `Edit "${confirmAction.log.food_name}"?`}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {editingLog && (
        <EditModal log={editingLog} onSave={submitEdit} onCancel={() => setEditingLog(null)} />
      )}

      {loading && <p style={styles.centerText}>Loading your history... 🌿</p>}
      {!loading && error && <p style={{ ...styles.centerText, color: "#d97b6c" }}>{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p style={styles.centerText}>{search ? "No logs match your search 🔍" : "No food logs yet — start logging! 🌱"}</p>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div style={styles.list}>
          {filtered.map(log => (
            <LogCard
              key={log.log_id}
              log={log}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUndo={handleUndo}
              highlighted={highlightedId === log.log_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page:         { maxWidth: 680, margin: "0 auto", padding: "32px 16px", fontFamily: "'Instrument Serif', Georgia, serif", backgroundColor: "#fffdf9", minHeight: "100vh" },
  header:       { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  headerRight:  { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  titleRow:     { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  titleIcon:    { fontSize: 28 },
  title:        { fontSize: 30, fontWeight: "bold", color: "#3a5a2a", margin: 0 },
  subtitle:     { fontSize: 14, color: "#8a9e7a", marginTop: 4, marginBottom: 0 },
  navBtn:       { padding: "8px 14px", fontSize: 13, borderRadius: 20, border: "1.5px solid #c8d7b0", backgroundColor: "#f5f9ee", color: "#4a7c2f", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" },

  searchWrapper:{ position: "relative", marginBottom: 20 },
  searchIcon:   { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" },
  searchBar:    { width: "100%", padding: "10px 14px 10px 38px", fontSize: 14, borderRadius: 14, border: "1.5px solid #dfe8cc", boxSizing: "border-box", outline: "none", backgroundColor: "#fafdf5", color: "#3a4a2e", fontFamily: "inherit" },

  list:         { display: "flex", flexDirection: "column", gap: 12 },
  card:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 18, borderRadius: 16, border: "1.5px solid #e8edd8", backgroundColor: "#ffffff", transition: "border-color 0.3s, background-color 0.3s", boxShadow: "0 2px 10px rgba(100,130,60,0.05)" },
  cardLeft:     { flex: 1 },
  foodName:     { fontWeight: "bold", fontSize: 17, color: "#3a4a2e", margin: "0 0 6px 0" },
  tags:         { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 },
  tagGreen:     { fontSize: 12, backgroundColor: "#dfeacc", color: "#3a5a2a", borderRadius: 20, padding: "3px 11px", border: "1px solid #c8d7b0" },
  tagSage:      { fontSize: 12, backgroundColor: "#eef2e8", color: "#5a7a40", borderRadius: 20, padding: "3px 11px", border: "1px solid #d0dcc0" },
  notes:        { fontSize: 13, color: "#8a9e7a", fontStyle: "italic", margin: "4px 0" },
  timestamp:    { fontSize: 12, color: "#b5b0a5", margin: "2px 0" },
  cardButtons:  { display: "flex", flexDirection: "column", gap: 7, marginLeft: 14 },
  editBtn:      { padding: "7px 14px", fontSize: 12, borderRadius: 10, border: "1.5px solid #c8d7b0", backgroundColor: "#f5f9ee", color: "#4a7c2f", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" },
  deleteBtn:    { padding: "7px 14px", fontSize: 12, borderRadius: 10, border: "1.5px solid #f5c2bb", backgroundColor: "#fef3f0", color: "#c0392b", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" },
  undoBtn:      { padding: "7px 14px", fontSize: 12, borderRadius: 10, border: "1.5px solid #e0dbd2", backgroundColor: "#faf8f4", color: "#8a8078", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" },

  centerText:   { textAlign: "center", color: "#b5b0a5", marginTop: 60, fontSize: 15 },
  toast:        { position: "fixed", top: 20, right: 20, padding: "12px 20px", borderRadius: 14, color: "#fff", fontWeight: "bold", fontSize: 14, zIndex: 1000, boxShadow: "0 4px 16px rgba(100,130,60,0.2)", fontFamily: "inherit" },

  overlay:      { position: "fixed", inset: 0, backgroundColor: "rgba(60,80,40,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modal:        { backgroundColor: "#fffdf9", borderRadius: 20, padding: 28, width: 360, boxShadow: "0 8px 32px rgba(60,80,40,0.15)", border: "1.5px solid #e8edd8" },
  modalTitle:   { fontSize: 18, fontWeight: "bold", color: "#3a5a2a", marginBottom: 16 },
  modalText:    { fontSize: 15, color: "#5a6a50", textAlign: "center", marginBottom: 20 },
  modalButtons: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 },
  label:        { display: "block", fontSize: 11, color: "#8a9e7a", marginBottom: 5, marginTop: 14, textTransform: "uppercase", letterSpacing: "0.03em" },
  input:        { width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 10, border: "1.5px solid #dfe8cc", boxSizing: "border-box", outline: "none", fontFamily: "inherit", backgroundColor: "#fafdf5", color: "#3a4a2e" },
  row:          { display: "flex", gap: 0 },
  cancelBtn:    { padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e0dbd2", backgroundColor: "#faf8f4", color: "#8a8078", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" },
  confirmBtn:   { padding: "9px 18px", borderRadius: 10, border: "none", backgroundColor: "#d97b6c", color: "#fff", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" },
  saveBtn:      { padding: "9px 18px", borderRadius: 10, border: "none", backgroundColor: "#91ab6f", color: "#fff", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" },
};