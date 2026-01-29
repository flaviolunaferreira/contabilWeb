
import re

file_path = r'c:\Users\re049801\Documents\Projetos\pessoais\contabilWeb\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Title
content = content.replace('<title>Fluxo 360 Ultimate - Stable</title>', '<title>BASA 360º Ultimate</title>')

# 2. CSS Variables
content = content.replace('--primary: #4f46e5;', '--primary: #006739;')

# 3. Specific Element Styles (CSS)
content = content.replace('border-left-color: #4f46e5;', 'border-left-color: #006739;')
content = content.replace('rgba(79, 70, 229, 0.15)', 'rgba(0, 103, 57, 0.15)')
content = content.replace('border-bottom: 3px solid #6366f1 !important;', 'border-bottom: 3px solid #006739 !important;') # Indigo-500 equivalent is #6366f1 sometimes or similar
# Wait, let's look at the file content for RGB values.
# The file has: border-bottom: 3px solid #6366f1 !important;
content = content.replace('#6366f1', '#006739')

# 4. Logo Section Logic
# Replace the Cube Icon div and Text
old_logo_section = """<div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <i class="fas fa-cube text-xl"></i>
            </div>
            <div>
                <h1 class="text-lg font-black tracking-tight leading-none">FLUXO 360</h1>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ultimate</p>
            </div>"""

new_logo_section = """<div class="w-10 h-10 bg-[#006739] rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <i class="fas fa-university text-xl"></i>
            </div>
            <div>
                <h1 class="text-lg font-black tracking-tight leading-none text-[#006739]">BASA</h1>
                <p class="text-[10px] text-[#FDB913] font-bold uppercase tracking-widest">360º Ultimate</p>
            </div>"""

content = content.replace(old_logo_section, new_logo_section)

# 5. Tailwind Class Replacements
replacements = {
    'bg-indigo-600': 'bg-[#006739]',
    'hover:bg-indigo-700': 'hover:bg-[#004d2c]',
    'text-indigo-600': 'text-[#006739]',
    'text-indigo-700': 'text-[#004d2c]',
    'text-indigo-500': 'text-[#006739]',
    'border-indigo-500': 'border-[#006739]',
    'focus:border-indigo-500': 'focus:border-[#006739]',
    'shadow-indigo-200': 'shadow-emerald-200',
    'bg-indigo-50': 'bg-emerald-50',
    'bg-indigo-500': 'bg-[#006739]',
    'hover:bg-indigo-600': 'hover:bg-[#004d2c]',
    'focus:ring-indigo-300': 'focus:ring-[#8DC63F]',
    'from-indigo-50': 'from-emerald-50',
    'to-purple-50': 'to-yellow-50', # Use yellow for secondary
    'text-indigo-500': 'text-[#006739]',
}

for old, new in replacements.items():
    content = content.replace(old, new)
    
# 6. Gradient Header in Table
# #transactions-table .group-header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
# Change to BASA Gradient: Green to Dark Green
content = content.replace('background: linear-gradient(135deg, #1e293b 0%, #334155 100%)', 'background: linear-gradient(135deg, #006739 0%, #004d2c 100%)')

# 7. Card Visa
# .card-visa { background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
content = content.replace('.card-visa { \n            background: linear-gradient(135deg, #0f172a 0%, #334155 100%);', '.card-visa { \n            background: linear-gradient(135deg, #006739 0%, #004d2c 100%);')

# 8. Nav Active
# .nav-item.active { background: #1e293b;
content = content.replace('.nav-item.active { background: #1e293b;', '.nav-item.active { background: #006739;')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Branding update finished.")
