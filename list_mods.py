import json
import os

LOG_PATH = '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/.system_generated/logs/transcript_full.jsonl'

modifications = []

with open(LOG_PATH, 'r') as f:
    for line in f:
        if not line.strip(): continue
        try:
            data = json.loads(line)
            step_index = data.get('step_index')
            
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    name = tc.get('name')
                    args = tc.get('args', {})
                    
                    if name in ['write_to_file', 'write_file', 'replace_file_content', 'multi_replace_file_content']:
                        if args.get('TargetFile', '').endswith('App.jsx'):
                            modifications.append({
                                'step': step_index,
                                'type': name
                            })
                            
                    elif name == 'run_command':
                        cmd = args.get('CommandLine', '')
                        if 'App.jsx' in cmd or 'transform_app' in cmd or 'fix' in cmd or 'apply' in cmd:
                            modifications.append({
                                'step': step_index,
                                'type': f"run_command: {cmd}"
                            })
                            
        except Exception as e:
            pass

for m in modifications:
    print(f"Step {m['step']}: {m['type']}")
print(f"Total modifications: {len(modifications)}")
