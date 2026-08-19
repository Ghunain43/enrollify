from datetime import time
from app.models.course import Section, Session, EnrollmentPreferences, TimeOfDayPreference, Weekday
from app.solver.backtracking import generate_valid_combinations
from app.solver.scoring import rank_combinations


def make_section(course_code, section, day, start, end, instructor="Dr. X"):
    return Section(
        course_code=course_code,
        course_title=f"{course_code} Title",
        section=section,
        instructor=instructor,
        sessions=[Session(day=day, start=time.fromisoformat(start), end=time.fromisoformat(end))],
    )


def test_no_conflict_combinations_only():
    sections = [
        make_section("CS301", "AM-1", Weekday.MON, "08:00", "09:30"),
        make_section("CS301", "PM-1", Weekday.MON, "14:00", "15:30"),
        make_section("MATH201", "AM-1", Weekday.MON, "08:00", "09:30"),  # conflicts with CS301 AM-1
        make_section("MATH201", "PM-1", Weekday.MON, "15:30", "17:00"),
    ]

    combos = generate_valid_combinations(["CS301", "MATH201"], sections)

    assert len(combos) == 3
    for combo in combos:
        codes = {s.course_code for s in combo}
        assert codes == {"CS301", "MATH201"}


def test_missing_course_raises():
    sections = [make_section("CS301", "AM-1", Weekday.MON, "08:00", "09:30")]
    try:
        generate_valid_combinations(["CS301", "PHY101"], sections)
        assert False, "Expected ValueError for missing course"
    except ValueError:
        pass


def test_ranking_prefers_all_am():
    sections = [
        make_section("CS301", "AM-1", Weekday.MON, "08:00", "09:30"),
        make_section("CS301", "PM-1", Weekday.MON, "14:00", "15:30"),
        make_section("MATH201", "AM-1", Weekday.TUE, "08:00", "09:30"),
        make_section("MATH201", "PM-1", Weekday.TUE, "15:30", "17:00"),
    ]

    combos = generate_valid_combinations(["CS301", "MATH201"], sections)
    prefs = EnrollmentPreferences(time_of_day=TimeOfDayPreference.ALL_AM)
    ranked = rank_combinations(combos, prefs, top_n=4)

    top = ranked[0]
    assert all(s.start < time(12, 0) for sec in top.sections for s in sec.sessions)