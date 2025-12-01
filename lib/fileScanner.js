import fs from 'fs';
import path from 'path';

export function listFiles(dataDir, folder) {
  const targetDir = folder && folder !== 'all' ? path.join(dataDir, folder) : dataDir;
  if (!fs.existsSync(targetDir)) return [];
  const files = [];
  function scan(dir, base = '') {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const rel = path.join(base, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) scan(itemPath, rel);
      else if (item.endsWith('.txt') || item.endsWith('.json')) {
        const type = item.endsWith('.txt') ? 'txt' : 'json';
        files.push({ name: item, path: rel, size: stat.size, modified: stat.mtime, type });
      }
    }
  }
  scan(targetDir);
  files.sort((a, b) => b.modified - a.modified);
  return files.map(f => ({ ...f, modified: f.modified.toISOString() }));
}

export function allTxtFiles(dataDir) {
  const out = [];
  function scan(dir, base = '') {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const rel = path.join(base, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) scan(itemPath, rel);
      else if (item.endsWith('.txt')) out.push(path.join(dataDir, rel));
    }
  }
  scan(dataDir);
  return out;
}

