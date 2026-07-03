import os
import glob

directory = r"c:\Users\nikhi\OneDrive\Documents\Classgrid_platfrom\classgrid_platform\client\src\features\auth\pages"
search_str = " focus-within:ring-1 focus-within:ring-emerald-500/50"

for filepath in glob.glob(os.path.join(directory, "*.tsx")):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if search_str in content:
        new_content = content.replace(search_str, "")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
