import json
import os
import re

LOG_PATH = '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/.system_generated/logs/transcript_full.jsonl'

head_lines = {}

with open(LOG_PATH, 'r') as f:
    for line in f:
        if not line.strip(): continue
        try:
            data = json.loads(line)
            if data.get('type') == 'VIEW_FILE':
                content = data.get('content', '')
                if 'Showing lines 1 to' in content and 'App.jsx' in content:
                    lines = content.split('\n')
                    for l in lines:
                        match = re.match(r'^(\d+):\s(.*)$', l)
                        if match:
                            line_num = int(match.group(1))
                            text = match.group(2)
                            head_lines[line_num] = text
        except Exception:
            pass

with open('/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/head_extracted_clean.txt', 'w') as out:
    for i in range(1, 200):
        if i in head_lines:
            out.write(f"{i}: {head_lines[i]}\n")
