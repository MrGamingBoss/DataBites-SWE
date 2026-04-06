import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LogFood.css";

const API_BASE = "http://127.0.0.1:5000";
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Other"];
const MOODS = ["Happy", "Neutral", "Stressed", "Tired", "Sad", "Excited"];

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

function LogFood() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );

  const [form, setForm] = useState({
    food_name: "",
    logged_at: getDefaultDateTime(),
    meal_type: "lunch",
    mood: "neutral",
    notes: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedLog, setLastSavedLog] = useState(null);

  useEffect(() => {
    if (!user?.user_id) {
      navigate("/");
    }
  }, [navigate, user]);

  if (!user?.user_id) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/log_food`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.user_id,
          food_name: form.food_name.trim(),
          logged_at: form.logged_at
            ? new Date(form.logged_at).toISOString()
            : undefined,
          meal_type: form.meal_type || null,
          mood: form.mood.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save your log.");
      }

      setLastSavedLog(data.log);
      setMessage(data.message || "Food logged successfully.");
      setMessageType("success");
      setForm({
        food_name: "",
        logged_at: getDefaultDateTime(),
        meal_type: form.meal_type,
        mood: form.mood,
        notes: "",
      });
    } catch (error) {
      setMessage(error.message || "Could not connect to server.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="log-food-page">
      <div className="log-food-shell">
        <header className="log-food-header">
          <div>
            <p className="log-food-eyebrow">Home</p>
            <h1 className="log-food-title">Create food log</h1>
            <p className="log-food-subtitle">
              Track what you ate, how you felt, and when it happened.
            </p>
          </div>

          <div className="log-food-user-panel">
            <span className="log-food-user-badge">
              {user.username || user.email || "DataBites user"}
            </span>
            <div className="log-food-header-actions">
              <button
                type="button"
                className="log-food-secondary-button"
                onClick={() => navigate("/history")}
              >
                View history
              </button>
              <button
                type="button"
                className="log-food-ghost-button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        <div className="log-food-grid">
          <section className="log-food-card log-food-hero-card">
            <div className="log-food-hero-copy">
              <p className="log-food-card-label">Today&apos;s check-in</p>
              <h2>Build a clearer picture of your eating patterns.</h2>
              <p>
                Small details matter. Meal timing, mood, and notes can help you
                spot habits that are easy to miss later.
              </p>
            </div>
            
            <div className="log-food-highlight-list">
              <div className="log-food-highlight">
                <span className="log-food-highlight-value">
                  {formatDateTime(form.logged_at)}
                </span>
                <span className="log-food-highlight-label">Selected time</span>
              </div>
              <div className="log-food-highlight">
                <span className="log-food-highlight-value">
                  {form.meal_type || "Meal"}
                </span>
                <span className="log-food-highlight-label">Meal type</span>
              </div>
              <div className="log-food-highlight">
                <span className="log-food-highlight-value">
                  {form.mood || "Mood"}
                </span>
                <span className="log-food-highlight-label">How you felt</span>
              </div>
            </div>
          </section>

          <section className="log-food-card">
            <div className="log-food-section-heading">
              <p className="log-food-card-label">New entry</p>
              <h2>Log a meal or snack</h2>
            </div>

            <form className="log-food-form" onSubmit={handleSubmit}>
              <label className="log-food-label" htmlFor="food_name">
                Food name
              </label>
              <input
                id="food_name"
                name="food_name"
                className="log-food-input"
                value={form.food_name}
                onChange={handleChange}
                placeholder="Ex. turkey sandwich, yogurt parfait, iced coffee"
                required
              />

              <label className="log-food-label" htmlFor="logged_at">
                Date and time
              </label>
              <input
                id="logged_at"
                type="datetime-local"
                name="logged_at"
                className="log-food-input"
                value={form.logged_at}
                onChange={handleChange}
              />

              <div className="log-food-field-group">
                <div>
                  <label className="log-food-label" htmlFor="meal_type">
                    Meal type
                  </label>
                  <select
                    id="meal_type"
                    name="meal_type"
                    className="log-food-input"
                    value={form.meal_type}
                    onChange={handleChange}
                  >
                    {MEAL_TYPES.map((mealType) => (
                      <option key={mealType} value={mealType}>
                        {mealType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="log-food-label" htmlFor="mood">
                    Mood
                  </label>
                  <input
                    id="mood"
                    name="mood"
                    className="log-food-input"
                    value={form.mood}
                    onChange={handleChange}
                    placeholder="How you felt?"
                    list="mood-options"
                  />
                  <datalist id="mood-options">
                    {MOODS.map((mood) => (
                      <option key={mood} value={mood} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <p className="log-food-label">Quick meal picks</p>
                <div className="log-food-chip-row">
                  {MEAL_TYPES.map((mealType) => (
                    <button
                      key={mealType}
                      type="button"
                      className={
                        form.meal_type === mealType
                          ? "log-food-chip is-active"
                          : "log-food-chip"
                      }
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          meal_type: mealType,
                        }))
                      }
                    >
                      {mealType}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="log-food-label">Mood shortcuts</p>
                <div className="log-food-chip-row">
                  {MOODS.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      className={
                        form.mood === mood
                          ? "log-food-chip is-active"
                          : "log-food-chip"
                      }
                      onClick={() =>
                        setForm((current) => ({ ...current, mood }))
                      }
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <label className="log-food-label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                className="log-food-input log-food-textarea"
                value={form.notes}
                onChange={handleChange}
                placeholder="Anything useful to remember? Location, portion, cravings, context..."
              />

              {message && (
                <div
                  className={
                    messageType === "success"
                      ? "log-food-message is-success"
                      : "log-food-message is-error"
                  }
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="log-food-primary-button"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save food log"}
              </button>
            </form>
          </section>

          <section className="log-food-card log-food-side-card">
            <div className="log-food-section-heading">
              <p className="log-food-card-label">Helpful prompts</p>
              <h2>Make each log more useful</h2>
            </div>

            <ul className="log-food-tip-list">
              <li>Include the main food or drink first so it is easy to scan later.</li>
              <li>Add a short note when something felt unusual, rushed, or especially satisfying.</li>
              <li>Log close to the time you ate to keep the timeline accurate.</li>
            </ul>
          </section>

          <section className="log-food-card log-food-side-card">
            <div className="log-food-section-heading">
              <p className="log-food-card-label">Last saved</p>
              <h2>Recent entry snapshot</h2>
            </div>

            {lastSavedLog ? (
              <div className="log-food-recent-entry">
                <h3>{lastSavedLog.food_name}</h3>
                <p>{formatDateTime(lastSavedLog.logged_at)}</p>
                <div className="log-food-tag-row">
                  {lastSavedLog.meal_type && (
                    <span className="log-food-tag">{lastSavedLog.meal_type}</span>
                  )}
                  {lastSavedLog.mood && (
                    <span className="log-food-tag">{lastSavedLog.mood}</span>
                  )}
                </div>
                {lastSavedLog.notes && <p>{lastSavedLog.notes}</p>}
              </div>
            ) : (
              <p className="log-food-empty-state">
                Your most recent saved meal will show up here after you submit
                your first log.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default LogFood;
