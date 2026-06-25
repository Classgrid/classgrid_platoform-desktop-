import os
import re

def process_file_content(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return False

    original = content
    
    # 1. Replace CgComponent with Component
    content = re.sub(r'Cg([A-Z])', r'\1', content)
    
    # 2. Replace cg- classes with just removing cg- or making it standard
    # e.g., cg-btn -> btn
    content = re.sub(r'cg-', '', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def rename_files_and_dirs(root_dir):
    # Rename files and directories bottom-up to avoid path issues
    for root, dirs, files in os.walk(root_dir, topdown=False):
        for name in files:
            if 'Cg' in name or 'cg-' in name:
                old_path = os.path.join(root, name)
                new_name = name.replace('Cg', '').replace('cg-', '')
                new_path = os.path.join(root, new_name)
                os.rename(old_path, new_path)
                print(f"Renamed file: {old_path} -> {new_path}")
        
        for name in dirs:
            if 'Cg' in name or 'cg-' in name:
                old_path = os.path.join(root, name)
                new_name = name.replace('Cg', '').replace('cg-', '')
                new_path = os.path.join(root, new_name)
                os.rename(old_path, new_path)
                print(f"Renamed dir: {old_path} -> {new_path}")

def main():
    src_dir = os.path.join(os.path.dirname(__file__), 'src')
    
    # Step 1: Process file contents
    count = 0
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                if process_file_content(filepath):
                    count += 1
    
    print(f"Updated content in {count} files.")
    
    # Step 2: Rename files
    rename_files_and_dirs(src_dir)
    print("Renamed files and directories.")

if __name__ == '__main__':
    main()
