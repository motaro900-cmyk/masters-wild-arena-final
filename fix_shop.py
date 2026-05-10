

import os

path = r'src/ui/components/hud/ShopScene.tsx'
with open(path, 'rb') as f:
    content = f.read()

# Find ARMOR: and the next const ALL_ITEMS
start_marker = b"ARMOR:"
end_marker = b"const ALL_ITEMS: ShopItem[] = ["

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
    # Use the correct bytes for Russian characters
    replacement = b"ARMOR: '/assets/images/ui/icons/ChatGPT Image 5 \xd0\xbc\xd0\xb0\xd1\x8f 213_4otoom-port.png'\n    };\n\n    "
    
    new_content = content[:start_idx] + replacement + content[end_idx:]
    
    with open(path, 'wb') as f:
        f.write(new_content)
    print('Fixed successfully')
else:
    print('Could not find markers', start_idx, end_idx)
