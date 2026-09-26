// Regenerates lib/robankSkillData.ts from cli/skill so the web agent and the published Skill never drift.
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../../cli/skill/', import.meta.url).pathname;
const files = {};
const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else files[path.relative(root, full).split(path.sep).join('/')] = fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n');
  }
};
walk(root);
fs.writeFileSync(new URL('../lib/robankSkillData.ts', import.meta.url), `// Generated from cli/skill by scripts/sync-skill.mjs. Do not edit by hand.\nexport const ROBANK_SKILL_FILES = ${JSON.stringify(files, null, 1)} as const;\n`);
console.log(`Synced ${Object.keys(files).length} skill files.`);
