import json
import os

LOG_PATH = '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/.system_generated/logs/transcript_full.jsonl'

best_entry = None
best_len = 0

with open(LOG_PATH, 'r') as f:
    for line in f:
        if not line.strip(): continue
        try:
            data = json.loads(line)
            content_str = json.dumps(data)
            
            if 'export default function App' in content_str and 'import React' in content_str:
                if len(content_str) > best_len:
                    best_len = len(content_str)
                    best_entry = data
        except Exception:
            pass

if best_entry:
    print(f"Found full dump! Length: {best_len}, Step: {best_entry.get('step_index')}, Type: {best_entry.get('type')}")
    # Write the raw dump to inspect it
    with open('/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/best_dump.json', 'w') as out:
        json.dump(best_entry, out, indent=2)
else:
    print("No full dump found containing both import React and export default function App.")
