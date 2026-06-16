import fs from 'fs';
import readline from 'readline';

const LOG_PATH = '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/.system_generated/logs/transcript_full.jsonl';

async function main() {
  const fileStream = fs.createReadStream(LOG_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lastGoodChunk = '';

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      if (line.includes('highlightClass = "bg-red-500 text-white') && line.includes('shadow-red-300')) {
        const parsed = JSON.parse(line);
        lastGoodChunk = JSON.stringify(parsed, null, 2);
      }
    } catch (e) {}
  }
  
  fs.writeFileSync('/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/src/good_chunk.txt', lastGoodChunk, 'utf8');
  console.log('Done!');
}
main();
