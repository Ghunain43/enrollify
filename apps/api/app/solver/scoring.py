from datetime import time
from app.models.course import Section, EnrollmentPreferences, TimeOfDayPreference, SchedulePlan, Weekday

NOON = time(12, 0)


def _is_morning_session(start: time) -> bool:
    return start < NOON


def _gaps_by_day(sections: list[Section]) -> dict[Weekday, list[float]]:
    """
    For each day used, sort that day's sessions by start time and compute
    the gap (in hours) between the end of one class and the start of the next.
    Returns e.g. {Weekday.MON: [1.5, 0.5], Weekday.TUE: [3.0]}
    """
    by_day: dict[Weekday, list] = {}
    for sec in sections:
        for sess in sec.sessions:
            by_day.setdefault(sess.day, []).append(sess)

    gaps: dict[Weekday, list[float]] = {}
    for day, sessions in by_day.items():
        sessions_sorted = sorted(sessions, key=lambda s: s.start)
        day_gaps = []
        for i in range(len(sessions_sorted) - 1):
            end_minutes = sessions_sorted[i].end.hour * 60 + sessions_sorted[i].end.minute
            next_start_minutes = sessions_sorted[i + 1].start.hour * 60 + sessions_sorted[i + 1].start.minute
            gap_hours = (next_start_minutes - end_minutes) / 60
            if gap_hours > 0:
                day_gaps.append(gap_hours)
        if day_gaps:
            gaps[day] = day_gaps
    return gaps


def exceeds_max_gap(sections: list[Section], max_gap_hours: float) -> bool:
    """True if any single gap between classes on the same day is too long."""
    gaps = _gaps_by_day(sections)
    for day_gaps in gaps.values():
        if any(g > max_gap_hours for g in day_gaps):
            return True
    return False


def score_combination(
    sections: list[Section],
    preferences: EnrollmentPreferences,
) -> tuple[float, list[str]]:
    """Returns (score, reasons) — reasons build the human-readable explanation."""
    score = 0.0
    reasons: list[str] = []

    all_starts = [s.start for sec in sections for s in sec.sessions]
    morning_count = sum(1 for t in all_starts if _is_morning_session(t))
    total_count = len(all_starts) or 1
    morning_ratio = morning_count / total_count

    if preferences.time_of_day == TimeOfDayPreference.ALL_AM:
        score += morning_ratio * 40
        if morning_ratio == 1.0:
            reasons.append("All classes are in the morning")
    elif preferences.time_of_day == TimeOfDayPreference.ALL_PM:
        score += (1 - morning_ratio) * 40
        if morning_ratio == 0.0:
            reasons.append("All classes are in the afternoon")
    elif preferences.time_of_day == TimeOfDayPreference.MIXED_TWO_SECTIONS:
        section_names = {sec.section for sec in sections}
        if len(section_names) <= 2:
            score += 30
            reasons.append("Classes come from at most two sections")

    used_days = {s.day for sec in sections for s in sec.sessions}
    if preferences.preferred_days_off:
        days_off_hit = [d for d in preferences.preferred_days_off if d not in used_days]
        ratio = len(days_off_hit) / len(preferences.preferred_days_off)
        score += ratio * 20
        if ratio == 1.0:
            reasons.append("All preferred days off are free")

    # Real gap scoring — reward tight schedules, not just fewer days used
    if preferences.minimize_gaps:
        gaps = _gaps_by_day(sections)
        all_gap_values = [g for day_gaps in gaps.values() for g in day_gaps]
        if all_gap_values:
            avg_gap = sum(all_gap_values) / len(all_gap_values)
            # Smaller average gap = higher score, capped at 20 points
            score += max(0, 20 - avg_gap * 4)
            if avg_gap <= 1.0:
                reasons.append("Little to no waiting time between classes")
        else:
            score += 20  # no gaps at all on any day

    if preferences.avoid_instructors:
        conflicts = [
            sec for sec in sections
            if sec.instructor and sec.instructor in preferences.avoid_instructors
        ]
        if not conflicts:
            score += 10
            reasons.append("No avoided instructors in this plan")
        else:
            score -= 15 * len(conflicts)

    return score, reasons


def rank_combinations(
    combinations: list[list[Section]],
    preferences: EnrollmentPreferences,
    top_n: int = 4,
) -> list[SchedulePlan]:
    """
    Filter out combinations with a gap longer than max_gap_hours, score the
    rest, and return the top N.
    """
    valid = [
        combo for combo in combinations
        if not exceeds_max_gap(combo, preferences.max_gap_hours)
    ]

    scored: list[SchedulePlan] = []
    for combo in valid:
        score, reasons = score_combination(combo, preferences)
        explanation = "; ".join(reasons) if reasons else "Conflict-free option"
        scored.append(SchedulePlan(sections=combo, score=score, explanation=explanation))

    scored.sort(key=lambda plan: plan.score, reverse=True)
    return scored[:top_n]