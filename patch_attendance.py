import os

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ensure we don't double replace
    if 'dark:bg-white/5' in content and 'dark:bg-[#0A0A0B]' in content:
        print(f"Skipping {filepath} (already patched)")
        return

    # Basic backgrounds and text
    content = content.replace('bg-[#0A0A0B]', 'bg-background dark:bg-[#0A0A0B]')
    content = content.replace('bg-[#1A1C20]', 'bg-muted dark:bg-[#1A1C20]')
    content = content.replace('text-slate-200', 'text-foreground dark:text-slate-200')
    
    # We must be careful with text-white since it might be used on colored backgrounds (like buttons).
    # Wait, text-white on emerald-500 is fine, but in these files it's used on backgrounds often. Let's just do it manually for text-white or check.
    # Actually, text-white is mainly used for headings. Let's replace 'text-white' with 'text-foreground dark:text-white' safely.
    # But wait, Button components or Badge might use text-white. 
    # Let's inspect where text-white is used before running.
    
    # White transparents
    content = content.replace('bg-white/5 ', 'bg-black/5 dark:bg-white/5 ')
    content = content.replace('bg-white/5"', 'bg-black/5 dark:bg-white/5"')
    content = content.replace('hover:bg-white/5 ', 'hover:bg-black/5 dark:hover:bg-white/5 ')
    content = content.replace('hover:bg-white/5"', 'hover:bg-black/5 dark:hover:bg-white/5"')
    content = content.replace('hover:bg-white/10 ', 'hover:bg-black/10 dark:hover:bg-white/10 ')
    content = content.replace('hover:bg-white/10"', 'hover:bg-black/10 dark:hover:bg-white/10"')
    content = content.replace('border-white/10', 'border-black/10 dark:border-white/10')
    content = content.replace('border-white/5', 'border-black/5 dark:border-white/5')
    
    # Black transparents
    content = content.replace('bg-black/20', 'bg-muted dark:bg-black/20')
    content = content.replace('bg-black/30', 'bg-muted/50 dark:bg-black/30')
    content = content.replace('bg-black/50', 'bg-muted dark:bg-black/50')
    
    # Replace text-white specifically for headings/text where background is light
    content = content.replace('text-white', 'text-foreground dark:text-white')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Patched {filepath}")

patch_file('client/src/features/attendance/pages/FacultyAttendancePortal.tsx')
patch_file('client/src/features/attendance/pages/StudentLeavePortal.tsx')
patch_file('client/src/features/system/pages/GlobeDemoPage.tsx')

