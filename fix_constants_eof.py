import os

src_file = 'src/constants.js'

with open(src_file, 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if line.strip().startswith("{ name: 'きょうりゅう',"):
        break
    new_lines.append(line)

# Also ensure it ends cleanly
while new_lines and new_lines[-1].strip() == '':
    new_lines.pop()
    
if not new_lines[-1].strip().endswith('};'):
    new_lines.append('};\n')

with open(src_file, 'w') as f:
    f.writelines(new_lines)
