import os
import pypandoc

# ✅ Automatically download Pandoc if missing
try:
    pypandoc.get_pandoc_version()
except OSError:
    print("Pandoc not found — downloading it now...")
    pypandoc.download_pandoc()

# ✅ Correct source and output folders
source_folder = r"C:\CBT_html\CompanyCBT\word_docs"
output_folder = r"C:\CBT_html\CompanyCBT\html_output"

# ✅ Make sure output folder exists
os.makedirs(output_folder, exist_ok=True)

# ✅ Convert all Word documents
for file in os.listdir(source_folder):
    if file.lower().endswith(".docx"):
        input_path = os.path.join(source_folder, file)
        output_path = os.path.join(output_folder, os.path.splitext(file)[0] + ".html")

        print(f"Converting: {file} → {os.path.basename(output_path)}")

        try:
            pypandoc.convert_file(
                input_path,
                "html",
                outputfile=output_path,
                extra_args=['--standalone']
            )
        except Exception as e:
            print(f"❌ Failed to convert {file}: {e}")

print("\n✅ All conversions completed.")
print(f"HTML files saved in: {output_folder}")
