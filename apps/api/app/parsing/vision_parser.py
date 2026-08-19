import json
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from app.models.course import ParsedTimetable

load_dotenv()

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PARSE_PROMPT = """You are looking at a screenshot of a university course \
timetable / available sections listing. Extract every course section you \
can see into the following JSON structure and return ONLY valid JSON, no \
markdown fences, no preamble:

{
  "university": "string",
  "semester": "string or null",
  "sections": [
    {
      "course_code": "string, e.g. CS301",
      "course_title": "string",
      "section": "string, e.g. BM-1",
      "instructor": "string or null",
      "credit_hours": number,
      "sessions": [
        {"day": "Mon|Tue|Wed|Thu|Fri|Sat|Sun", "start": "HH:MM", "end": "HH:MM", "room": "string or null"}
      ]
    }
  ]
}

If a course meets on multiple days (e.g. "Mon,Wed"), create a SEPARATE \
session entry for each day, not one combined entry. If a field isn't \
visible or determinable, use null. Do not invent data that isn't in the \
image. If the image is unreadable or not a timetable, return \
{"university": "unknown", "semester": null, "sections": []}.
"""


def parse_timetable_screenshot(image_bytes: bytes, mime_type: str = "image/png") -> ParsedTimetable:
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            PARSE_PROMPT,
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        ],
    )

    raw_text = response.text.strip()
    cleaned = raw_text.replace("```json", "").replace("```", "").strip()

    data = json.loads(cleaned)
    return ParsedTimetable(**data)