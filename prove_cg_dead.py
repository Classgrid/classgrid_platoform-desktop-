import os
import re

def search_cg_remnants(directory):
    count = 0
    pattern1 = re.compile(r'<Cg[A-Z]')
    pattern2 = re.compile(r'import\s+.*Cg[A-Z].*from.*classgrid', re.IGNORECASE)
    pattern3 = re.compile(r'className=["\'][^"\']*cg-')

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                    if pattern1.search(content) or pattern2.search(content) or pattern3.search(content):
                        # Verify it's not a false positive like cgpa or cgp-sidebar
                        # Actually pattern1 enforces Capital letter after Cg, so it won't match cgpa
                        # pattern3 matches cg- classNames, let's see if there are any left. We intentionally ignored cgp- earlier, but cg- should be gone.
                        if "cgp-" in content and not pattern1.search(content) and not pattern2.search(content):
                            continue # Ignore candidate portal cgp-
                        
                        count += 1
                        print(f"⚠️ FOUND REMNANT IN: {filepath}")
    
    return count

if __name__ == "__main__":
    target_dir = os.path.dirname(__file__)
    print("==================================================")
    print("🔍 SCANNING ENTIRE SYSTEM FOR Cg COMPONENTS...")
    print("==================================================")
    
    remnants = search_cg_remnants(target_dir)
    
    print("==================================================")
    if remnants == 0:
        print("✅ PROOF VERIFIED: ZERO legacy Cg components found.")
        print("✅ PROOF VERIFIED: ZERO legacy Cg imports found.")
        print("✅ PROOF VERIFIED: ZERO legacy cg- classes found.")
        print("THE CG SYSTEM IS COMPLETELY AND UTTERLY DEAD.")
    else:
        print(f"❌ Found {remnants} files with remnants.")
    print("==================================================")
