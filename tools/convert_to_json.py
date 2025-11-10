import os
import json
from docx import Document

# 📁 Folder containing all your Chapter .docx files
input_folder = r"C:\CBT_html\CompanyCBT\presentation"
output_file = os.path.join(input_folder, "allchapters.json")

def read_docx(filepath):
    """Extracts paragraphs and returns them as clean text blocks."""
    doc = Document(filepath)
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return paragraphs

def create_chapter_json(filename, paragraphs):
    """Creates a JSON structure for one chapter."""
    title = paragraphs[0] if paragraphs else filename
    chapter_id = (
        os.path.splitext(filename)[0]
        .replace(" ", "_")
        .replace(".", "_")
        .lower()
    )

    slides = []
    summary_text = None

    # Loop through all paragraphs except the first (title)
    for i, para in enumerate(paragraphs[1:], start=1):
        # Detect summary paragraph
        if para.lower().startswith("summary") or para.lower().startswith("✅ summary"):
            summary_text = para
            continue
        slides.append({
            "title": f"Section {i}",
            "text": f"<p>{para}</p>"
        })

    # Add summary slide at the top if found
    if summary_text:
        slides.insert(0, {
            "title": title,
            "text": f"<div class='summary-box'><strong>{summary_text}</strong></div>"
        })
    else:
        slides.insert(0, {
            "title": title,
            "text": "<div class='summary-box'><strong>Summary not provided.</strong></div>"
        })

    return {
        "id": chapter_id,
        "title": title,
        "slides": slides
    }

def main():
    chapters = []

    for file_name in sorted(os.listdir(input_folder)):
        if file_name.lower().endswith(".docx"):
            path = os.path.join(input_folder, file_name)
            paragraphs = read_docx(path)
            if not paragraphs:
                continue
            chapter_json = create_chapter_json(file_name, paragraphs)
            chapters.append(chapter_json)
            print(f"✔ Processed: {file_name}")

    final_data = {"chapters": chapters}

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Done! Created: {output_file}")
    print(f"Total chapters processed: {len(chapters)}")

if __name__ == "__main__":
    main()
