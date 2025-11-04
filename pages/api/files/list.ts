import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface QuestionFile {
  name: string;
  size: number;
  modified: string;
  type: 'txt' | 'json';
  relativePath: string;
  folder: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    if (!fs.existsSync(dataDir)) {
      return res.status(404).json({ error: 'Data directory not found', files: [] });
    }

    const files: QuestionFile[] = [];
    
    // 递归读取data目录下的所有文件
    function readDirectory(dirPath: string, relativePath: string = '') {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // 递归读取子目录
          const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
          readDirectory(itemPath, newRelativePath);
        } else if (stats.isFile() && (item.endsWith('.txt') || item.endsWith('.json'))) {
          // 只处理txt和json文件
          
          files.push({
            name: item, // 只显示文件名，不包含路径
            size: stats.size,
            modified: stats.mtime.toISOString(),
            type: item.endsWith('.txt') ? 'txt' : 'json',
            relativePath: relativePath, // 文件所在的文件夹路径
            folder: relativePath // 文件夹名称
          });
        }
      }
    }

    readDirectory(dataDir);
    
    // 按文件名排序
    files.sort((a, b) => a.name.localeCompare(b.name));
    
    res.status(200).json({ 
      success: true, 
      files,
      total: files.length
    });
    
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ 
      error: 'Failed to read files',
      files: []
    });
  }
}