import re

with open(r'c:\Users\Motar\Desktop\Masters of the Wild\temp_extract\word\document.xml', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', content)

with open(r'c:\Users\Motar\Desktop\Masters of the Wild\extracted_text.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(matches))
