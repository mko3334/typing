const fs = require('fs');

const constantsContent = fs.readFileSync('src/constants.js', 'utf8');
const gearPowerContent = fs.readFileSync('src/utils/gearPower.js', 'utf8');

const names = [];
const gachaItemsMatch = constantsContent.match(/export const GACHA_ITEMS = \[([\s\S]*?)\];/);
if (gachaItemsMatch) {
  const itemsBlock = gachaItemsMatch[1];
  const nameRegex = /name:\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = nameRegex.exec(itemsBlock)) !== null) {
    names.push(match[1]);
  }
}

const readingNames = new Set();
const readingsMatch = gearPowerContent.match(/export const ITEM_READINGS = \{([\s\S]*?)\};/);
if (readingsMatch) {
  const readingsBlock = readingsMatch[1];
  const readingRegex = /['"`]([^'"`]+)['"`]:/g;
  let match;
  while ((match = readingRegex.exec(readingsBlock)) !== null) {
    readingNames.add(match[1]);
  }
}

const missing = names.filter(n => !readingNames.has(n));
console.log("Missing from ITEM_READINGS:", missing);

const powerNames = new Set();
const powerMatch = gearPowerContent.match(/export const ITEM_GEAR_POWERS = \{([\s\S]*?)\};/);
if (powerMatch) {
  const powerBlock = powerMatch[1];
  const powerRegex = /['"`]([^'"`]+)['"`]:/g;
  let match;
  while ((match = powerRegex.exec(powerBlock)) !== null) {
    powerNames.add(match[1]);
  }
}

const missingPower = names.filter(n => !powerNames.has(n));
console.log("Missing from ITEM_GEAR_POWERS:", missingPower);
