import re
import glob

def patch_chat(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Chat specific replaces
    content = content.replace('bg-[#0f0f0f]', 'bg-background dark:bg-[#0f0f0f]')
    content = content.replace('bg-[#111111]', 'bg-muted dark:bg-[#111111]')
    content = content.replace('border-white/10', 'border-border dark:border-white/10')
    content = content.replace('border-white/30', 'border-border dark:border-white/30')
    
    # We must be careful with text-white in chat, because there are things like text-white inside colored bubbles.
    # We'll just replace specific known problematic ones or do it manually if it's too risky.
    # Actually, ChatBubble has `border-white/30`, `text-[#e9edef]`, `border-white/10`.
    content = content.replace('text-[#e9edef]', 'text-foreground dark:text-[#e9edef]')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

files = glob.glob('client/src/features/chat/**/*.tsx', recursive=True)

for file in files:
    patch_chat(file)
    print(f"Patched {file}")
