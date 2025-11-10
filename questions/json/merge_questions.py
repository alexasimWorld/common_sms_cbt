import json, os

# Input folder containing all your chapter JSON files
input_dir = r"C:\CBT_html\CompanyCBT\questions\json"
output_file = os.path.join(input_dir, "all_questions.json")

merged = []

print("🚢 Starting merge process...\n")

for fname in os.listdir(input_dir):
    if fname.endswith(".json") and fname != "all_questions.json":
        file_path = os.path.join(input_dir, fname)
        try:
            # Open file with tolerant UTF-8 reader
            with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
                data = json.load(f)

                if "Questions" in data and isinstance(data["Questions"], list):
                    chapter = data.get("SectionTitle", fname)
                    count_before = len(merged)

                    for q in data["Questions"]:
                        letter = (q.get("CorrectAnswer", "").strip().upper())
                        idx = ["A", "B", "C", "D"].index(letter) if letter in ["A", "B", "C", "D"] else 0
                        merged.append({
                            "chapter": chapter,
                            "question": q.get("QuestionText", ""),
                            "choices": q.get("Options", []),
                            "correctIndex": idx,
                            "Reason": q.get("Reason", "")
                        })

                    added = len(merged) - count_before
                    print(f"✅ Added {added} questions from {fname}")

                else:
                    print(f"⚠️ No 'Questions' array found in {fname}")

        except json.JSONDecodeError as e:
            print(f"❌ Error parsing {fname}: {e}")
        except Exception as e:
            print(f"❌ Unexpected error in {fname}: {e}")

# Write combined output
with open(output_file, "w", encoding="utf8") as f:
    json.dump(merged, f, indent=2, ensure_ascii=False)

print(f"\n✅ Merged {len(merged)} total questions → {output_file}")
