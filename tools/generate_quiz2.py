import os, json, random
from docx import Document

# === CONFIG ===
FOLDER = "questions"   # Folder where your 33 .docx files are unzipped
OUTPUT = "quiz.json"
total_target = 240

# === Question templates ===
TEMPLATES_TRUE = [
    "Which of the following is true about {}?",
    "Select the correct statement regarding {}.",
    "Which statement accurately describes {}?"
]
TEMPLATES_FILL = [
    "{} is best described as ___",
    "Complete the following: {} ___",
    "Fill in the blank: {} ___"
]
TEMPLATES_BEST = [
    "Choose the best answer: {}",
    "Which of the following best explains {}?",
    "Identify the best option related to {}."
]

def make_question(text, chapter):
    text = text.strip()
    if len(text.split()) < 5:
        return None

    q_type = random.choices(["true", "fill", "best"], weights=[0.5, 0.25, 0.25])[0]
    if q_type == "true":
        q = random.choice(TEMPLATES_TRUE).format(text.split('.')[0])
    elif q_type == "fill":
        q = random.choice(TEMPLATES_FILL).format(text.split('.')[0])
    else:
        q = random.choice(TEMPLATES_BEST).format(text.split('.')[0])

    correct = text.split('.')[0]
    distractors = random.sample([
        "None of the above", "Partially correct", "Incorrect information",
        "Opposite of correct", "Irrelevant to topic", "Misleading statement"
    ], 3)

    choices = [correct] + distractors
    random.shuffle(choices)
    return {
        "question": q,
        "choices": choices,
        "correctIndex": choices.index(correct),
        "chapter": chapter
    }

questions = []
for fname in sorted(os.listdir(FOLDER)):
    if fname.endswith(".docx"):
        path = os.path.join(FOLDER, fname)
        chapter = fname.replace(".docx", "").replace("Chapter ", "")
        doc = Document(path)
        for p in doc.paragraphs:
            q = make_question(p.text, chapter)
            if q:
                questions.append(q)

random.shuffle(questions)
questions = questions[:total_target]

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump({"questions": questions}, f, indent=2, ensure_ascii=False)

print(f"✅ Created {len(questions)} questions in {OUTPUT}")
