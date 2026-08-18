from datetime import time
from app.models.course import Section, EnrollmentPreferences, TimeOfDayPreference, SchedulePlan

NOON = time(12, 0)


def _is_morning_session(start: time) -> bool:
    return start < NOON


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

    if preferences.minimize_gaps:
        score += max(0, (7 - len(used_days))) * 2

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
    """Score all combinations and return the top N as SchedulePlan objects."""
    scored: list[SchedulePlan] = []

    for combo in combinations:
        score, reasons = score_combination(combo, preferences)
        explanation = "; ".join(reasons) if reasons else "Conflict-free option"
        scored.append(SchedulePlan(sections=combo, score=score, explanation=explanation))

    scored.sort(key=lambda plan: plan.score, reverse=True)
    return scored[:top_n]