import json
import re

LOG_PATH = '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/.system_generated/logs/transcript_full.jsonl'

lines_dict = {}

with open(LOG_PATH, 'r') as f:
    for line in f:
        if not line.strip(): continue
        try:
            data = json.loads(line)
            if data.get('type') == 'VIEW_FILE' or data.get('type') == 'GREP_SEARCH':
                content = data.get('content', '')
                if 'App.jsx' in content:
                    lines = content.split('\n')
                    for l in lines:
                        match = re.match(r'^(\d+):\s(.*)$', l)
                        if match:
                            line_num = int(match.group(1))
                            text = match.group(2)
                            lines_dict[line_num] = text
        except Exception:
            pass

with open('/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/extracted_all.txt', 'w') as out:
    for i in sorted(lines_dict.keys()):
        out.write(f"{i}: {lines_dict[i]}\n")
