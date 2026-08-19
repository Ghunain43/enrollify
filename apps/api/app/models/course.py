from datetime import time
from enum import Enum
from pydantic import BaseModel, Field


class Weekday(str, Enum):
    MON = "Mon"
    TUE = "Tue"
    WED = "Wed"
    THU = "Thu"
    FRI = "Fri"
    SAT = "Sat"
    SUN = "Sun"


class Session(BaseModel):
    """A single recurring class meeting (e.g. 'Mon 8:30-10:00 in R-204')."""
    day: Weekday
    start: time
    end: time
    room: str | None = None


class Section(BaseModel):
    """One offered section of a course (e.g. CS301 - Section BM-1)."""
    course_code: str = Field(..., examples=["CS301"])
    course_title: str | None = None
    section: str = Field(..., examples=["BM-1"])
    instructor: str | None = None
    credit_hours: float | None = None
    sessions: list[Session]

    def overlaps_with(self, other: "Section") -> bool:
        """Check whether this section's sessions conflict with another's."""
        for s1 in self.sessions:
            for s2 in other.sessions:
                if s1.day != s2.day:
                    continue
                if s1.start < s2.end and s2.start < s1.end:
                    return True
        return False


class TimeOfDayPreference(str, Enum):
    ALL_AM = "all_am"
    ALL_PM = "all_pm"
    MIXED_TWO_SECTIONS = "mixed_two_sections"
    NO_PREFERENCE = "no_preference"


class EnrollmentPreferences(BaseModel):
    """What the student tells us before we generate plans."""
    time_of_day: TimeOfDayPreference = TimeOfDayPreference.NO_PREFERENCE
    preferred_days_off: list[Weekday] = []
    minimize_gaps: bool = True
    max_gap_hours: float = 3.0
    avoid_instructors: list[str] = []


class SchedulePlan(BaseModel):
    """One generated, scored, conflict-free schedule option."""
    sections: list[Section]
    score: float
    explanation: str


class ParsedTimetable(BaseModel):
    """Output of the screenshot-parsing step: all sections found for one university/semester upload."""
    university: str
    semester: str | None = None
    sections: list[Section]