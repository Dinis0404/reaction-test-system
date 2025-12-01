import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

export default function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { folder } = req.query;
    
    let targetDir = dataDir;
    if (folder && folder !== 'all') {
      targetDir = path.join(dataDir, folder);
    }
    
    if (!fs.existsSync(targetDir)) {
      return res.status(200).json({ files: [] });
    }

    const files = [];
    
    function scanDirectory(dir, basePath = '') {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          scanDirectory(itemPath, relativePath);
        } else if (item.endsWith('.txt') || item.endsWith('.json')) {
          const fileType = item.endsWith('.txt') ? 'txt' : 'json';
          files.push({
            name: item,
            path: relativePath,
            size: stat.size,
            modified: stat.mtime,
            type: fileType
          });
        }
      }
    }
    
    scanDirectory(targetDir);
    
    // 按修改时间排序，最新的在前面
    files.sort((a, b) => b.modified - a.modified);
    
    res.status(200).json({ 
      files: files.map(f => ({
        ...f,
        modified: f.modified.toISOString()
      }))
    });
    
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ 
      error: 'Failed to list files',
      message: error.message 
    });
  }
}