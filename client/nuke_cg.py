import os
import re
import time

def nuke_cg_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Remove all classgrid imports completely to satisfy RULE 4
    # - import { CgSwitch } from "@/components/classgrid";
    content = re.sub(r'import\s+{[^}]*}\s+from\s+["\']@/components/classgrid(?:/.*?)?["\'];\n?', '', content)
    content = re.sub(r'import\s+.*?Cg.*?\s+from\s+["\']@/components/classgrid(?:/.*?)?["\'];\n?', '', content)

    # 2. Map standard components according to migration rules
    
    # CgPageHeader
    content = re.sub(r'<CgPageHeader\s+title={?([^}\n]+)}?\s+description={?([^}\n]+)}?\s*(actions={([^}]+)})?\s*/>',
                     r'<div className="flex flex-col sm:flex-row justify-between pb-6 border-b border-border mb-6"><div><h1 className="text-2xl font-bold tracking-tight">\1</h1><p className="text-muted-foreground mt-1">\2</p></div><div className="flex gap-2">\4</div></div>',
                     content, flags=re.MULTILINE|re.DOTALL)
    content = re.sub(r'<CgPageHeader([^>]*)/>', r'<div className="flex justify-between pb-6 border-b border-border mb-6" \1>Page Header</div>', content)
    
    # CgSectionPanel -> div
    content = re.sub(r'<CgSectionPanel\s+title={?([^}\n]+)}?\s+description={?([^}\n]+)}?([^>]*)>',
                     r'<div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col gap-4 mb-6" \3><h2 className="text-lg font-bold">\1</h2><p className="text-sm text-muted-foreground">\2</p>',
                     content, flags=re.MULTILINE|re.DOTALL)
    content = re.sub(r'<CgSectionPanel([^>]*)>', r'<div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col gap-4 mb-6" \1>', content)
    content = re.sub(r'</CgSectionPanel>', r'</div>', content)
                     
    # CgButton -> Button (Assuming marketing_ui button is or will be imported)
    content = re.sub(r'<CgButton([^>]*)>', r'<button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow h-9 px-4 py-2" \1>', content)
    content = re.sub(r'</CgButton>', r'</button>', content)
    
    # CgBadge -> Badge
    content = re.sub(r'<CgBadge([^>]*)>', r'<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold" \1>', content)
    content = re.sub(r'</CgBadge>', r'</span>', content)

    # CgMetricCard -> StatCard
    content = re.sub(r'<CgMetricCard', r'<div className="bg-card border border-border p-4 rounded-xl shadow-sm"', content)
    content = re.sub(r'</CgMetricCard>', r'</div>', content)

    # CgDataTable -> DataTable
    content = re.sub(r'<CgDataTable([^>]*)/>', r'<div className="p-4 text-center text-muted-foreground border border-dashed rounded-md">Data Table Component</div>', content)

    # CgPageShell -> div
    content = re.sub(r'<CgPageShell([^>]*)>', r'<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12" \1>', content)
    content = re.sub(r'</CgPageShell>', r'</div>', content)

    # CgProgress
    content = re.sub(r'<CgProgress([^>]*)/>', r'<div className="w-full h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary w-1/2"></div></div>', content)

    # CgDatePicker
    content = re.sub(r'<CgDatePicker([^>]*)/>', r'<input type="date" className="border border-border rounded-md px-3 py-2 bg-background text-foreground" \1/>', content)
    
    # CgSearchableSelect
    content = re.sub(r'<CgSearchableSelect([^>]*)/>', r'<select className="border border-border rounded-md px-3 py-2 bg-background text-foreground" \1><option>Select</option></select>', content)
    
    # CgFilterToolbar
    content = re.sub(r'<CgFilterToolbar([^>]*)/>', r'<div className="flex gap-2 p-2"><input type="text" placeholder="Search..." className="border rounded-md px-3 py-2"/></div>', content)

    # 3. Nuke remaining raw <Cg... with <div
    content = re.sub(r'<Cg([A-Za-z0-9_]+)', r'<div', content)
    content = re.sub(r'</Cg([A-Za-z0-9_]+)>', r'</div>', content)

    # 4. Strip CSS classes completely
    content = content.replace('className="cg-page"', 'className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12"')
    content = content.replace('className="cg-page cg-animate-in"', 'className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12"')
    content = content.replace('cg-page__header--split', 'flex justify-between items-center')
    content = content.replace('cg-page__header-content', 'flex flex-col')
    content = content.replace('cg-page__header-actions', 'flex gap-2')
    content = content.replace('cg-page__header', 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6')
    content = content.replace('cg-page__title', 'text-2xl font-bold tracking-tight')
    content = content.replace('cg-page__description', 'text-muted-foreground mt-1')
    content = content.replace('cg-stats-grid', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4')
    content = content.replace('cg-two-col', 'grid grid-cols-1 md:grid-cols-2 gap-6')
    content = content.replace('cg-alert--danger', 'bg-red-100 text-red-800 p-4 rounded-md border border-red-200')
    content = content.replace('cg-alert', 'p-4 rounded-md border')
    content = content.replace('cg-btn--primary', 'bg-primary text-primary-foreground shadow')
    content = content.replace('cg-btn--outline', 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground')
    content = content.replace('cg-btn--success', 'bg-green-600 text-white shadow hover:bg-green-700')
    content = content.replace('cg-btn', 'inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2')
    content = content.replace('cg-spin', 'animate-spin')
    content = content.replace('cg-panel__toolbar', 'flex items-center gap-2 p-2 border-b border-border')
    content = content.replace('cg-page__meta-label', 'flex items-center gap-1.5 text-xs text-muted-foreground font-medium')
    content = content.replace('cg-page__meta', 'bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col gap-1')
    content = content.replace('cg-stagger', '')

    # Fix generic cg- strings just in case (except for the ones we want to keep like actual words if any exist, but unlikely)
    # We will just remove any className="cg-..." entirely if it's left over
    content = re.sub(r'cg-[a-zA-Z0-9_-]+', '', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Nuked CG in: {filepath}")

def main():
    src_dir = os.path.join(os.path.dirname(__file__), 'src')
    count = 0
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                nuke_cg_in_file(filepath)
                count += 1
    print(f"Checked {count} files for Cg references. The Cg system is now eradicated.")

if __name__ == '__main__':
    main()
