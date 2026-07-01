import os

def patch_file(filepath):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generic replaces
    content = content.replace('bg-[#0f0f0f]', 'bg-background dark:bg-[#0f0f0f]')
    content = content.replace('bg-[#111111]', 'bg-muted dark:bg-[#111111]')
    content = content.replace('bg-[#141414]', 'bg-background dark:bg-[#141414]')
    content = content.replace('text-[#ededed]', 'text-foreground dark:text-[#ededed]')
    content = content.replace('border-white/[0.14]', 'border-border dark:border-white/[0.14]')
    content = content.replace('border-white/[0.15]', 'border-border dark:border-white/[0.15]')
    content = content.replace('hover:bg-[#222222]', 'hover:bg-zinc-200 dark:hover:bg-[#222222]')
    content = content.replace('text-white', 'text-foreground dark:text-white')
    content = content.replace('border-white/10', 'border-border dark:border-white/10')
    content = content.replace('hover:bg-white/5', 'hover:bg-black/5 dark:hover:bg-white/5')
    content = content.replace('bg-white/5', 'bg-black/5 dark:bg-white/5')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Patched {filepath}")

patch_file('client/src/features/auth/pages/ResetPasswordPage.tsx')

