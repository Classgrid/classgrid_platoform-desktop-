import os
import re

def fix_returns(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return False

    changed = False
    for i in range(len(lines)):
        # Look for the target div line
        if '<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12"' in lines[i]:
            # Check previous non-empty lines
            j = i - 1
            while j >= 0 and lines[j].strip() == '':
                j -= 1
            
            if j >= 0 and 'return' not in lines[j] and '=>' not in lines[j] and '(' not in lines[j].strip()[-1:]:
                # It's missing a return (
                # Let's insert it
                indent = len(lines[i]) - len(lines[i].lstrip())
                lines.insert(i, ' ' * indent + 'return (\n')
                changed = True
                print(f"Fixed missing return in {filepath}:{i+1}")
                break # Only fix the first occurrence (page shell is usually once)

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        return True
    return False

def main():
    src_dir = os.path.join(os.path.dirname(__file__), 'src')
    count = 0
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.jsx')):
                filepath = os.path.join(root, file)
                if fix_returns(filepath):
                    count += 1
    
    print(f"Fixed {count} files.")

if __name__ == '__main__':
    main()
