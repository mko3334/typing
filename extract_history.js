import fs from 'fs';
import readline from 'readline';
import path from 'path';

const LOG_PATH = '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/.system_generated/logs/transcript_full.jsonl';
const OUT_DIR = '/Users/motoyamayuuki/.gemini/antigravity/scratch/app_jsx_backups';

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  
  const fileStream = fs.createReadStream(LOG_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let counter = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      const str = JSON.stringify(parsed);
      
      if (str.includes('App.jsx')) {
        if (parsed.tool_calls) {
          for (const tc of parsed.tool_calls) {
            if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
              if (tc.args && tc.args.TargetFile && tc.args.TargetFile.endsWith('App.jsx')) {
                 const rep = tc.args.ReplacementContent || (tc.args.ReplacementChunks && tc.args.ReplacementChunks[0] && tc.args.ReplacementChunks[0].ReplacementContent);
                 if (rep) {
                    fs.writeFileSync(path.join(OUT_DIR, `edit_${counter}_step${parsed.step_index}.txt`), rep, 'utf8');
                    counter++;
                 }
              }
            } else if (tc.name === 'write_to_file' || tc.name === 'write_file') {
              if (tc.args && tc.args.TargetFile && tc.args.TargetFile.endsWith('App.jsx')) {
                 if (tc.args.CodeContent) {
                    fs.writeFileSync(path.join(OUT_DIR, `full_${counter}_step${parsed.step_index}.txt`), tc.args.CodeContent, 'utf8');
                    counter++;
                 }
              }
            }
          }
        }
        
        // Also check if view_file or read_file returned something
        if (parsed.type === 'TOOL_RESPONSE' && parsed.content && parsed.content.includes('File Path: `file:///Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/src/App.jsx`')) {
           fs.writeFileSync(path.join(OUT_DIR, `view_${counter}_step${parsed.step_index}.txt`), parsed.content, 'utf8');
           counter++;
        }
      }
    } catch (e) {}
  }
  
  console.log(`Saved ${counter} files to ${OUT_DIR}`);
}
main();
