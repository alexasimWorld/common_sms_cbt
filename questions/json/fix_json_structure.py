import json, os, re

file_path = r"C:\CBT_html\CompanyCBT\questions\json\allquestions.json"
fixed_path = os.path.join(os.path.dirname(file_path), "allquestions_fixed.json")

with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
    text = f.read().strip()

# Split on top-level curly braces patterns separating JSON objects
# We assume each object starts with {"section":
parts = re.split(r'\n\s*\{\s*"section"\s*:', text)

# reconstruct valid JSON array
json_blocks = []
for i, part in enumerate(parts):
    if not part.strip():
        continue
    # add back the removed {"section":
    if not part.strip().startswith('{'):
        part = '{"section":' + part
    try:
        obj = json.loads(part)
        json_blocks.append(obj)
    except Exception as e:
        print(f"⚠️ Skipped one invalid block ({i+1}): {e}")

with open(fixed_path, "w", encoding="utf8") as f:
    json.dump(json_blocks, f, indent=2, ensure_ascii=False)

print(f"✅ Rebuilt valid JSON array → {fixed_path}")
print(f"✅ Total chapters combined: {len(json_blocks)}")
