import re
import glob

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generic replaces
    content = content.replace('bg-[#0f0f0f]', 'bg-background dark:bg-[#0f0f0f]')
    content = content.replace('bg-[#111111]', 'bg-muted dark:bg-[#111111]')
    content = content.replace('bg-[#141414]', 'bg-background dark:bg-[#141414]')
    content = content.replace('bg-[#080808]', 'bg-background dark:bg-[#080808]')
    
    # Borders
    content = content.replace('border-white/[0.15]', 'border-border dark:border-white/[0.15]')
    content = content.replace('border-white/[0.14]', 'border-border dark:border-white/[0.14]')
    content = content.replace('border-white/20', 'border-border dark:border-white/20')
    
    # Text colors
    content = content.replace('text-[#ededed]', 'text-foreground dark:text-[#ededed]')
    content = content.replace('text-white/65', 'text-muted-foreground dark:text-white/65')
    content = content.replace('text-white/60', 'text-muted-foreground dark:text-white/60')
    content = content.replace('text-white/55', 'text-muted-foreground dark:text-white/55')
    content = content.replace('text-white/70', 'text-muted-foreground dark:text-white/70')
    content = content.replace('text-white/40', 'text-muted-foreground dark:text-white/40')
    
    # specific backgrounds
    content = content.replace('hover:bg-[#222222]', 'hover:bg-zinc-200 dark:hover:bg-[#222222]')
    content = content.replace('bg-white/[0.14]', 'bg-border dark:bg-white/[0.14]')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

files = glob.glob('client/src/features/auth/pages/*.tsx')
targets = [
    'CustomDomainUserLoginPage.tsx',
    'CustomDomainAdminLoginPage.tsx',
    'ClassgridSubdomainUserLoginPage.tsx',
    'ClassgridSubdomainAdminLoginPage.tsx',
    'TestFullScreenLoginPage.tsx'
]

for file in files:
    if any(t in file for t in targets):
        patch_file(file)
        print(f"Patched {file}")
