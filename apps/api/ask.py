# ask.py  (put it in apps/api/, next to test_crawl.py)
# Usage:  python ask.py "what is the fee for BSCS?"
import sys

from app.parsing.answer import generate_answer

question = " ".join(sys.argv[1:]) or input("Question: ")
result = generate_answer(question)

print(f"\nSEARCHED FOR: {result['standalone']}")
print("\nRETRIEVED CHUNKS (score | source | title | url):")
for h in result["hits"]:
    print(f"  {h['score']:6.2f} | {h['source']:7s} | {h['title'][:45]} | {h['url']}")
    print(f"           {h['content'][:110].replace(chr(10), ' ')!r}")
if not result["hits"]:
    print("  (nothing retrieved)")

print("\nANSWER:\n" + result["text"])
print("\nTIMINGS (seconds):", result["timings"])