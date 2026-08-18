from app.models.course import Section


def group_sections_by_course(sections: list[Section]) -> dict[str, list[Section]]:
    """Group a flat list of sections by course_code."""
    grouped: dict[str, list[Section]] = {}
    for sec in sections:
        grouped.setdefault(sec.course_code, []).append(sec)
    return grouped


def generate_valid_combinations(
    required_course_codes: list[str],
    all_sections: list[Section],
) -> list[list[Section]]:
    """
    Generate every combination of sections (one per required course) that
    has zero time conflicts, using backtracking with early pruning.
    """
    grouped = group_sections_by_course(all_sections)

    for code in required_course_codes:
        if code not in grouped or not grouped[code]:
            raise ValueError(f"No sections found for required course: {code}")

    course_lists = [grouped[code] for code in required_course_codes]
    valid_combinations: list[list[Section]] = []

    def backtrack(index: int, current: list[Section]) -> None:
        if index == len(course_lists):
            valid_combinations.append(list(current))
            return

        for candidate in course_lists[index]:
            conflict = any(candidate.overlaps_with(chosen) for chosen in current)
            if conflict:
                continue
            current.append(candidate)
            backtrack(index + 1, current)
            current.pop()

    backtrack(0, [])
    return valid_combinations