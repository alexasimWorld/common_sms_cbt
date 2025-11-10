from bs4 import BeautifulSoup
import os

source_folder = r"C:\CBT_html\CompanyCBT\content"

for file in os.listdir(source_folder):
    if file.endswith(".html"):
        path = os.path.join(source_folder, file)
        with open(path, encoding="utf-8") as f:
            soup = BeautifulSoup(f, "html.parser")
        body = soup.body
        if body:
            cleaned_html = body.decode_contents()
            with open(path, "w", encoding="utf-8") as f:
                f.write(cleaned_html)
        print(f"✅ Cleaned {file}")
