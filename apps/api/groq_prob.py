from dotenv import load_dotenv
load_dotenv()
import time
from groq import Groq

client = Groq(max_retries=0)  # no hidden retries, so errors show up
for i in range(15):
    t = time.time()
    try:
        raw = client.chat.completions.with_raw_response.create(
            model="openai/gpt-oss-20b", max_completion_tokens=200, reasoning_effort="low",
            messages=[{"role": "user", "content": "Say hi in five words."}])
        h = raw.headers
        print(f"{i:2d} {time.time()-t:5.2f}s  req_left={h.get('x-ratelimit-remaining-requests')} "
              f"tok_left={h.get('x-ratelimit-remaining-tokens')}")
    except Exception as e:
        print(f"{i:2d} {time.time()-t:5.2f}s  ERROR {type(e).__name__}: {str(e)[:120]}")