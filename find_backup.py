import json
import os

LOG_PATH = '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/.system_generated/logs/transcript_full.jsonl'

best_content = None

with open(LOG_PATH, 'r') as f:
    for line in f:
        if not line.strip(): continue
        try:
            data = json.loads(line)
            # Check if this is a tool call that modifies or writes App.jsx
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    if tc.get('name') in ['write_to_file', 'write_file', 'multi_replace_file_content', 'replace_file_content']:
                        args = tc.get('args', {})
                        if args.get('TargetFile', '').endswith('src/App.jsx'):
                            if 'CodeContent' in args:
                                best_content = args['CodeContent']
                            
            # Check if this is a view_file response that might have the whole file
            # or if the agent used some other tool that dumped the file
            
        except Exception:
            pass

if best_content:
    print(f"Found full file! Length: {len(best_content)}")
    with open('/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/src/App.jsx.backup', 'w') as out:
        out.write(best_content)
else:
    print("No full file found.")
