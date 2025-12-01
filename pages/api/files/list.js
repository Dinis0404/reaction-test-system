import path from 'path';
import { listFiles } from '../../../lib/fileScanner';

const dataDir = path.join(process.cwd(), 'data');

export default function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { folder } = req.query;
    
    const files = listFiles(dataDir, folder);
    res.status(200).json({ files });
    
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ 
      error: 'Failed to list files',
      message: error.message 
    });
  }
}
