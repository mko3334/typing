import fs from 'fs';
import readline from 'readline';

const LOG_PATH = '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/.system_generated/logs/transcript_full.jsonl';
const APP_JSX_PATH = '/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/src/App.jsx';

async function main() {
  const fileStream = fs.createReadStream(LOG_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let bestContent = '';
  let bestTime = '';

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      const str = JSON.stringify(parsed);
      
      if (str.includes('kids-typing-game/src/App.jsx')) {
        if (parsed.tool_calls) {
          for (const tc of parsed.tool_calls) {
            if (tc.name === 'write_to_file' || tc.name === 'write_file') {
              if (tc.args && tc.args.TargetFile && tc.args.TargetFile.endsWith('App.jsx')) {
                 if (tc.args.CodeContent) {
                   bestContent = tc.args.CodeContent;
                   bestTime = 'write_to_file found';
                 }
              }
            }
          }
        }
      }
    } catch (e) {}
  }
  
  if (bestContent.length > 0) {
    console.log("Found backup! Length:", bestContent.length);
    fs.writeFileSync(APP_JSX_PATH, bestContent, 'utf8');
  } else {
    console.log("No full backup found via write_to_file.");
  }
}
main();
