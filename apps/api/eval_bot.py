# eval_bot.py  (put it in apps/api/)
# Usage:  python eval_bot.py
# Each case has facts we know are correct from the live site. Run it after every change:
# if a change fixes one question but breaks another, you see it immediately.
import re
import time

from app.parsing.answer import generate_answer

# must: every item has to appear. An item can be a tuple = any one of these is enough.
# must_not: none of these may appear.
CASES = [
    {"q": "What is the eligibility for BBA?", "must": ["50%"], "must_not": ["45%"]},
    {"q": "What percentage do I need for BS Computer Science?", "must": ["50%", "math"]},
    {"q": "Do pre-medical students need anything extra for BSCS?", "must": [("deficiency", "6 credit")]},
    {"q": "What is the eligibility for PhD in Computer Science?", "must": [("3.00", "3.0"), "18"]},
    {"q": "What is the tuition fee per credit hour?", "must": ["10,000"], "must_not": ["6,000", "9,000"]},
    {"q": "how much is the fee for bscs", "must": ["10,000"]},
    {"q": "What is the PhD tuition fee per credit hour?", "must": ["13,000"]},
    {"q": "What is the application processing fee?", "must": [("3,000", "3000")]},
    {"q": "What is the admission fee?", "must": [("20,000", "20000")]},
    {"q": "Is the admission fee refundable?", "must": [("non-refundable", "not refundable", "isn't refundable", "no refund", "not be refunded")]},
    {"q": "What GPA do I need for a 100% scholarship?", "must": [("4.00", "4.0")]},
    {"q": "What is the minimum CGPA to keep a scholarship as an undergraduate?", "must": [("2.50", "2.5")]},
    {"q": "When am I put on probation as an undergraduate?", "must": [("2.0", "2.00")]},
    {"q": "What are the merit list weightages for BS programs?", "must": ["50%", "30%", "20%"]},
    {"q": "What is the UAN number of MAJU?", "must": [("021-111-87-87-87", "111-87-87-87")]},
    {"q": "What is the university email?", "must": ["info@jinnah.edu"]},
    {"q": "What is the dress code for girls?", "must": [("shalwar", "dupatta")]},
    # Leadership comes from the curated entries (checked against the Faculty of Computing
    # members page). Re-check these names each intake and update the cases if they change.
    {"q": "Who is the president of MAJU?", "must": ["zubair"], "must_not": ["mansoor"]},
    {"q": "Who is the dean of the Faculty of Computing?", "must": ["wasi"], "must_not": ["qadir"]},
    {"q": "Who is the academic dean of computing?", "must": ["jami"]},
    {"q": "hey how are you", "must": [("MAJU", "maju bot")]},
    {"q": "Who won the cricket world cup?", "must": [("MAJU", "university")]},
    {
        "q": "what about BSSE?",
        "history": [
            {"role": "user", "content": "What is the eligibility for BS Computer Science?"},
            {"role": "assistant", "content": "You need at least 50% in Intermediate, DAE or A-Levels with Mathematics."},
        ],
        "must": ["50%", "math"],
    },
]


def norm(s: str) -> str:
    for ch in ("\u2011", "\u2013", "\u2010"):
        s = s.replace(ch, "-")
    return re.sub(r"\s+%", "%", s.lower())


def ok(text: str, case: dict):
    t = norm(text)
    missing = []
    for item in case.get("must", []):
        options = item if isinstance(item, tuple) else (item,)
        if not any(norm(o) in t for o in options):
            missing.append(" or ".join(options))
    forbidden = [w for w in case.get("must_not", []) if norm(w) in t]
    return missing, forbidden


passed = 0
for i, case in enumerate(CASES, 1):
    start = time.time()
    result = generate_answer(case["q"], case.get("history"))
    missing, forbidden = ok(result["text"], case)
    good = not missing and not forbidden
    passed += good
    print(f"{'PASS' if good else 'FAIL'} {i:2d}. {case['q']}  ({time.time() - start:.1f}s)  {result['timings']}")
    if not good:
        if missing:
            print("      missing  :", missing)
        if forbidden:
            print("      forbidden:", forbidden)
        print("      answer   :", result["text"].replace("\n", " ")[:900])
        for h in result["hits"][:3]:
            print(f"      chunk    : {h['score']:.1f} {h['title'][:40]} | {h['url']}")
    time.sleep(1.5)  # stay under Groq rate limits

print(f"\n{passed}/{len(CASES)} passed")