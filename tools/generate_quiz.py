import os, json, re
from bs4 import BeautifulSoup

CONTENT = r"C:\CBT_html\CompanyCBT\content"
OUT = r"C:\CBT_html\CompanyCBT\data\quiz.json"

def sentences(text):
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in parts if 40 <= len(s) <= 220]

def make_mcq(statement):
    # Very naive distractors; replace with better logic as you refine
    correct = statement
    base = re.sub(r'\b(shall|must|should|are|is|be)\b', 'should', statement, flags=re.I)
    wrong1 = base.replace('should', 'could', 1)
    wrong2 = base.replace('should', 'might', 1)
    wrong3 = base.replace('should', 'must not', 1)
    q = re.sub(r'\.$', '', re.sub(r'\bis\b|\bare\b|\bshould\b', 'What', statement, count=1, flags=re.I))
    q = "Which statement is most accurate?\n" + q
    choices = [correct, wrong1, wrong2, wrong3]
    return {
        "question": q.strip(),
        "choices": choices,
        "correctIndex": 0
    }

bank = []
for fname in sorted(os.listdir(CONTENT)):
    if not fname.lower().endswith(".html"): continue
    chap = re.sub(r'\D+', '', fname) or None
    with open(os.path.join(CONTENT, fname), encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")
    text = soup.get_text(" ", strip=True)
    cand = sentences(text)[:6]  # take a few per chapter
    for s in cand:
        mcq = make_mcq(s)
        mcq["chapter"] = int(chap) if chap else None
        bank.append(mcq)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(bank, f, ensure_ascii=False, indent=2)

print(f"✅ Wrote {len(bank)} questions to {OUT}")
