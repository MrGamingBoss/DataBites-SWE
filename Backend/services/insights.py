# services/insights.py
# Insights service — generates and returns habit summaries for the frontend
# Covers: mood breakdown, time-of-day patterns, top meals, weekly trend, cached summary
# Mirrors the blueprint structure used in meal_log.py, history.py, auth.py

from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta, date
import sqlite3
import os

insights_bp = Blueprint("insights", __name__)

DB_PATH = os.environ.get("DB_PATH", "databites.db")


def get_db():
    """Open a database connection with row factory so rows behave like dicts."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ---------------------------------------------------------------------------
# Helper: date range from period type

def get_period_range(period: str):
    """
    Returns (period_start, period_end) as date objects.
    'weekly'  → last 7 days
    'monthly' → last 30 days
    """
    today = date.today()
    if period == "weekly":
        return today - timedelta(days=6), today
    else:
        return today - timedelta(days=29), today

# ---------------------------------------------------------------------------
# Helper: run a query and return all rows as plain dicts

def query(conn, sql, params=()):
    cursor = conn.execute(sql, params)
    return [dict(row) for row in cursor.fetchall()]

# ---------------------------------------------------------------------------
# GET /insights/summary
# Returns the cached summary row from the summaries table.
# If no cached row exists yet, generates it on the fly and caches it.
#
# Query params:
#   user_id     (required)
#   period      'weekly' | 'monthly'  (default: weekly)


@insights_bp.route("/insights/summary", methods=["GET"])
def get_summary():
    user_id = request.args.get("user_id")
    period  = request.args.get("period", "weekly")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    if period not in ("weekly", "monthly"):
        return jsonify({"error": "period must be 'weekly' or 'monthly'"}), 400

    period_start, period_end = get_period_range(period)

    conn = get_db()
    try:
        # Try cached summary first
        rows = query(
            conn,
            """
            SELECT * FROM summaries
            WHERE user_id = ? AND period_type = ? AND period_start = ?
            """,
            (user_id, period, period_start.isoformat()),
        )

        if rows:
            return jsonify(rows[0])

        # No cache — compute and store it
        summary = _generate_and_cache_summary(conn, user_id, period, period_start, period_end)
        return jsonify(summary)

    finally:
        conn.close()

# ---------------------------------------------------------------------------
# GET /insights/mood
# Mood breakdown — count per mood value for the selected period.
# Used for the mood bar chart on the insights page.

@insights_bp.route("/insights/mood", methods=["GET"])
def get_mood_breakdown():
    user_id = request.args.get("user_id")
    period  = request.args.get("period", "weekly")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    period_start, period_end = get_period_range(period)

    conn = get_db()
    try:
        rows = query(
            conn,
            """
            SELECT mood, COUNT(*) AS count
            FROM active_food_logs
            WHERE user_id = ?
              AND DATE(logged_at) BETWEEN ? AND ?
              AND mood IS NOT NULL
            GROUP BY mood
            ORDER BY count DESC
            """,
            (user_id, period_start.isoformat(), period_end.isoformat()),
        )
        return jsonify(rows)

    finally:
        conn.close()
        
# ---------------------------------------------------------------------------
# GET /insights/time-of-day
# Groups logs into Morning / Midday / Afternoon / Evening buckets.
# Used for the time-of-day grid on the insights page.

@insights_bp.route("/insights/time-of-day", methods=["GET"])
def get_time_of_day():
    user_id = request.args.get("user_id")
    period  = request.args.get("period", "weekly")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    period_start, period_end = get_period_range(period)

    conn = get_db()
    try:
        rows = query(
            conn,
            """
            SELECT
                CASE
                    WHEN CAST(strftime('%H', logged_at) AS INTEGER) BETWEEN 5  AND 11 THEN 'morning'
                    WHEN CAST(strftime('%H', logged_at) AS INTEGER) BETWEEN 12 AND 14 THEN 'midday'
                    WHEN CAST(strftime('%H', logged_at) AS INTEGER) BETWEEN 15 AND 17 THEN 'afternoon'
                    ELSE 'evening'
                END AS time_slot,
                COUNT(*) AS count
            FROM active_food_logs
            WHERE user_id = ?
              AND DATE(logged_at) BETWEEN ? AND ?
            GROUP BY time_slot
            ORDER BY count DESC
            """,
            (user_id, period_start.isoformat(), period_end.isoformat()),
        )
        return jsonify(rows)

    finally:
        conn.close()

# ---------------------------------------------------------------------------
# GET /insights/top-meals
# Most frequently logged food names for the selected period.
# Used for the "most frequent meals" chip list.

@insights_bp.route("/insights/top-meals", methods=["GET"])
def get_top_meals():
    user_id = request.args.get("user_id")
    period  = request.args.get("period", "weekly")
    limit   = int(request.args.get("limit", 5))

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    period_start, period_end = get_period_range(period)

    conn = get_db()
    try:
        rows = query(
            conn,
            """
            SELECT food_name, COUNT(*) AS count
            FROM active_food_logs
            WHERE user_id = ?
              AND DATE(logged_at) BETWEEN ? AND ?
            GROUP BY LOWER(food_name)
            ORDER BY count DESC
            LIMIT ?
            """,
            (user_id, period_start.isoformat(), period_end.isoformat(), limit),
        )
        return jsonify(rows)

    finally:
        conn.close()

# ---------------------------------------------------------------------------
# GET /insights/trend
# Log counts grouped by week (for monthly view) or by day (for weekly view).
# Used for the bar chart on the insights page.

@insights_bp.route("/insights/trend", methods=["GET"])
def get_trend():
    user_id = request.args.get("user_id")
    period  = request.args.get("period", "weekly")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    period_start, period_end = get_period_range(period)

    # Weekly view → group by day; monthly view → group by week number
    if period == "weekly":
        group_expr  = "DATE(logged_at)"
        label_expr  = "DATE(logged_at)"
    else:
        group_expr  = "strftime('%Y-W%W', logged_at)"
        label_expr  = "strftime('%Y-W%W', logged_at)"

    conn = get_db()
    try:
        rows = query(
            conn,
            f"""
            SELECT {label_expr} AS label, COUNT(*) AS count
            FROM active_food_logs
            WHERE user_id = ?
              AND DATE(logged_at) BETWEEN ? AND ?
            GROUP BY {group_expr}
            ORDER BY label ASC
            """,
            (user_id, period_start.isoformat(), period_end.isoformat()),
        )
        return jsonify(rows)

    finally:
        conn.close()

# ---------------------------------------------------------------------------
# POST /insights/refresh
# Force-regenerates the cached summary for a user + period.
# Call this from meal_log.py / history.py whenever a log is
# created, edited, or deleted so the cache stays fresh.
# Body (JSON): { "user_id": 1, "period": "weekly" }

@insights_bp.route("/insights/refresh", methods=["POST"])
def refresh_summary():
    data    = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    period  = data.get("period", "weekly")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    period_start, period_end = get_period_range(period)

    conn = get_db()
    try:
        # Delete stale cache row so _generate_and_cache_summary writes a fresh one
        conn.execute(
            """
            DELETE FROM summaries
            WHERE user_id = ? AND period_type = ? AND period_start = ?
            """,
            (user_id, period, period_start.isoformat()),
        )
        conn.commit()

        summary = _generate_and_cache_summary(conn, user_id, period, period_start, period_end)
        return jsonify({"message": "summary refreshed", "summary": summary})

    finally:
        conn.close()

## ---------------------------------------------------------------------------
# Internal: compute summary stats and write to summaries table

def _generate_and_cache_summary(conn, user_id, period, period_start, period_end):
    """
    Computes all summary fields from active_food_logs and inserts a row
    into the summaries table. Returns the summary as a plain dict.
    """
    p_start = period_start.isoformat()
    p_end   = period_end.isoformat()

    # Total entries in period
    total = query(
        conn,
        """
        SELECT COUNT(*) AS total FROM active_food_logs
        WHERE user_id = ? AND DATE(logged_at) BETWEEN ? AND ?
        """,
        (user_id, p_start, p_end),
    )[0]["total"]

    # Days with at least one log
    days_logged = query(
        conn,
        """
        SELECT COUNT(DISTINCT DATE(logged_at)) AS days
        FROM active_food_logs
        WHERE user_id = ? AND DATE(logged_at) BETWEEN ? AND ?
        """,
        (user_id, p_start, p_end),
    )[0]["days"]

    # Most common meal type
    meal_rows = query(
        conn,
        """
        SELECT meal_type, COUNT(*) AS cnt
        FROM active_food_logs
        WHERE user_id = ? AND DATE(logged_at) BETWEEN ? AND ?
          AND meal_type IS NOT NULL
        GROUP BY meal_type ORDER BY cnt DESC LIMIT 1
        """,
        (user_id, p_start, p_end),
    )
    most_common_meal_type = meal_rows[0]["meal_type"] if meal_rows else None

    # Most common mood
    mood_rows = query(
        conn,
        """
        SELECT mood, COUNT(*) AS cnt
        FROM active_food_logs
        WHERE user_id = ? AND DATE(logged_at) BETWEEN ? AND ?
          AND mood IS NOT NULL
        GROUP BY mood ORDER BY cnt DESC LIMIT 1
        """,
        (user_id, p_start, p_end),
    )
    most_common_mood = mood_rows[0]["mood"] if mood_rows else None

    # Auto-generate a plain-text blurb
    period_label = "week" if period == "weekly" else "month"
    blurb_parts  = []

    if total == 0:
        blurb_parts.append(f"No meals were logged this {period_label}.")
    else:
        blurb_parts.append(
            f"You logged {total} meal{'s' if total != 1 else ''} across "
            f"{days_logged} day{'s' if days_logged != 1 else ''} this {period_label}."
        )
        if most_common_meal_type:
            blurb_parts.append(f"{most_common_meal_type.capitalize()} was your most frequent meal type.")
        if most_common_mood:
            blurb_parts.append(f"You most often felt {most_common_mood} when eating.")

    summary_notes = " ".join(blurb_parts)

    # Insert into summaries (replace if somehow a race condition created a duplicate)
    conn.execute(
        """
        INSERT OR REPLACE INTO summaries
            (user_id, period_type, period_start, period_end,
             total_entries, most_common_meal_type, most_common_mood,
             days_logged, summary_notes, generated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """,
        (
            user_id, period, p_start, p_end,
            total, most_common_meal_type, most_common_mood,
            days_logged, summary_notes,
        ),
    )
    conn.commit()

    return {
        "user_id":               user_id,
        "period_type":           period,
        "period_start":          p_start,
        "period_end":            p_end,
        "total_entries":         total,
        "most_common_meal_type": most_common_meal_type,
        "most_common_mood":      most_common_mood,
        "days_logged":           days_logged,
        "summary_notes":         summary_notes,
    }
