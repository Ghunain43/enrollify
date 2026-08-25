from datetime import time
from app.models.course import Section, EnrollmentPreferences, TimeOfDayPreference, SchedulePlan, Weekday

NOON = time(12, 0)


def _is_morning_session(start: time) -> bool:
    return start < NOON


def _sessions_by_day(sections: list[Section]) -> dict[Weekday, list]:
    by_day: dict[Weekday, list] = {}
    for sec in sections:
        for sess in sec.sessions:
            by_day.setdefault(sess.day, []).append(sess)
    return by_day


def _gaps_by_day(sections: list[Section]) -> dict[Weekday, list[float]]:
    by_day = _sessions_by_day(sections)
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
    gaps = _gaps_by_day(sections)
    return any(g > max_gap_hours for day_gaps in gaps.values() for g in day_gaps)


def exceeds_max_classes_per_day(sections: list[Section], max_per_day: int | None) -> bool:
    if max_per_day is None:
        return False
    by_day = _sessions_by_day(sections)
    return any(len(sessions) > max_per_day for sessions in by_day.values())


def score_combination(
    sections: list[Section],
    preferences: EnrollmentPreferences,
) -> tuple[float, list[str]]:
    score = 0.0
    reasons: list[str] = []

    all_starts = [s.start for sec in sections for s in sec.sessions]
    morning_count = sum(1 for t in all_starts if _is_morning_session(t))
    total_count = len(all_starts) or 1
    morning_ratio = morning_count / total_count

   

    used_days = {s.day for sec in sections for s in sec.sessions}
    if preferences.preferred_days_off:
        days_off_hit = [d for d in preferences.preferred_days_off if d not in used_days]
        ratio = len(days_off_hit) / len(preferences.preferred_days_off)
        score += ratio * 20
        if ratio == 1.0:
            reasons.append("All preferred days off are free")

    if preferences.minimize_gaps:
        gaps = _gaps_by_day(sections)
        all_gap_values = [g for day_gaps in gaps.values() for g in day_gaps]
        if all_gap_values:
            avg_gap = sum(all_gap_values) / len(all_gap_values)
            score += max(0, 20 - avg_gap * 4)
            if avg_gap <= 1.0:
                reasons.append("Little to no waiting time between classes")
        else:
            score += 20

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
    valid = [
        combo for combo in combinations
        if not exceeds_max_gap(combo, preferences.max_gap_hours)
        and not exceeds_max_classes_per_day(combo, preferences.max_classes_per_day)
    ]

    # Hard filter: if a specific section was requested, ONLY keep combinations
    # made entirely of that section — no partial/mixed results allowed.
    if preferences.preferred_section:
        valid = [
            combo for combo in valid
            if all(sec.section == preferences.preferred_section for sec in combo)
        ]

    scored: list[SchedulePlan] = []
    for combo in valid:
        score, reasons = score_combination(combo, preferences)
        explanation = "; ".join(reasons) if reasons else "Conflict-free option"
        scored.append(SchedulePlan(sections=combo, score=score, explanation=explanation))

    scored.sort(key=lambda plan: plan.score, reverse=True)
    return scored[:top_n]