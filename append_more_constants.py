import os

src_file = 'src/App.jsx.reconstructed'
dest_file = 'src/constants.js'

with open(src_file, 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'const ROMAJI_TABLE = {' in line:
        start_idx = i
    if 'const FINGER_MAP = {' in line:
        # We need to find the end of FINGER_MAP which is '};'
        for j in range(i, len(lines)):
            if '};' in lines[j] and '}' in lines[j]:
                end_idx = j + 1
                break
        break

if start_idx != -1 and end_idx != -1:
    extracted = lines[start_idx:end_idx]
    
    # modify exports
    modified = []
    for line in extracted:
        if line.startswith('const ROMAJI_TABLE'):
            modified.append(line.replace('const ROMAJI_TABLE', 'export const ROMAJI_TABLE'))
        elif line.startswith('const toHiragana'):
            modified.append(line.replace('const toHiragana', 'export const toHiragana'))
        elif line.startswith('function generateAllRomaji'):
            modified.append(line.replace('function generateAllRomaji', 'export function generateAllRomaji'))
        elif line.startswith('const WORDS'):
            modified.append(line.replace('const WORDS', 'export const WORDS'))
        elif line.startswith('const FINGER_MAP'):
            modified.append(line.replace('const FINGER_MAP', 'export const FINGER_MAP'))
        else:
            modified.append(line)
            
    with open(dest_file, 'a') as f:
        f.write('\n\n')
        f.writelines(modified)
    print("Constants appended successfully.")
else:
    print(f"Failed to find indices: start={start_idx}, end={end_idx}")
