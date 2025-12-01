import { useState, useEffect } from 'react';

interface QuestionFile {
  name: string;
  size: number;
  modified: string;
  type: 'txt' | 'json';
  path: string;
}

interface FileSelectorProps {
  selectedFiles: string[];
  onFilesChange: (files: string[]) => void;
  selectedFolder?: string;
}

export default function FileSelector({ selectedFiles, onFilesChange, selectedFolder = 'all' }: FileSelectorProps) {
  const [files, setFiles] = useState<QuestionFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [selectedFolder]);

  // 根据文件夹过滤文件 - 基于文件的相对路径
  const filterFilesByFolder = (files: QuestionFile[]) => {
    if (selectedFolder === 'all') {
      return files;
    }
    
    return files.filter(file => {
      // 使用 path 的頂層目錄作為分類（兼容 Windows 反斜線）
      const normalizedPath = file.path.replace(/\\/g, '/');
      const fileFolder = normalizedPath.includes('/') ? normalizedPath.split('/')[0].toLowerCase() : '';
      
      switch (selectedFolder) {
        case 'chinese':
          // 语文相关文件 - 检查是否在chinese或语文文件夹中
          return fileFolder === 'chinese' || fileFolder === '语文';
        case 'math':
          // 数学相关文件 - 检查是否在math或数学文件夹中
          return fileFolder === 'math' || fileFolder === '数学';
        case 'english':
          // 英文相关文件 - 检查是否在english或英文文件夹中，或者根目录（folder为空）
          return fileFolder === 'english' || fileFolder === '英文' || fileFolder === '';
        case 'other':
          // 其他类别文件 - 检查是否在other或其他文件夹中
          return fileFolder === 'other' || fileFolder === '其他';
        default:
          return true;
      }
    });
  };

  const loadFiles = async () => {
    try {
      console.log('正在加载文件列表...');
      console.log('当前选择的文件夹:', selectedFolder);
      const response = await fetch('/api/files/list');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('文件列表API响应错误:', response.status, errorText);
        throw new Error(`載入檔案列表失敗 (${response.status})`);
      }
      
      const data = await response.json();
      console.log('原始文件列表:', data.files?.length || 0, '个文件');
      
      // 根据文件夹过滤文件
      const filteredFiles = filterFilesByFolder(data.files || []);
      console.log('过滤后文件列表:', filteredFiles.length, '个文件');
      
      setFiles(filteredFiles);
    } catch (error) {
      console.error('載入檔案列表錯誤:', error);
      // 设置空文件列表而不是保持loading状态
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (file: QuestionFile) => {
    // 使用 API 返回的 path（相對於 data/ 的路徑）
    const normalizedPath = file.path.replace(/\\/g, '/');
    const filePath = normalizedPath;
    
    if (selectedFiles.includes(filePath)) {
      onFilesChange(selectedFiles.filter(f => f !== filePath));
    } else {
      onFilesChange([...selectedFiles, filePath]);
    }
  };

  const selectAll = () => {
    onFilesChange(files.map(f => f.path.replace(/\\/g, '/')));
  };

  const deselectAll = () => {
    onFilesChange([]);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border-2 border-dashed border-gray-600">
        <p className="text-gray-400 text-center">還沒有題目檔案</p>
        <p className="text-sm text-gray-500 text-center mt-2">
          請在 data/ 目錄下新增 .txt 或 .json 格式的題目檔案
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 mb-6 border border-gray-700 flex-1 min-h-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-100 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          選擇題目檔案
        </h3>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors font-medium border border-gray-600"
          >
            全選
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors font-medium border border-gray-600"
          >
            取消
          </button>
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
        {files.map((file) => {
          const filePath = file.path.replace(/\\/g, '/');
          const isSelected = selectedFiles.includes(filePath);
          return (
          <label
            key={filePath}
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
              isSelected
                ? 'bg-blue-900/30 border-2 border-blue-500'
                : 'bg-gray-700 border-2 border-gray-600 hover:border-blue-500 hover:bg-gray-700/50'
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleFile(file)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer bg-gray-800 border-gray-600"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${isSelected ? 'text-blue-300' : 'text-gray-200'}`}>
                  {file.name}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  file.type === 'txt' 
                    ? 'bg-blue-900/50 text-blue-300 border border-blue-700' 
                    : 'bg-purple-900/50 text-purple-300 border border-purple-700'
                }`}>
                  {file.type.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </div>
            </div>
          </label>
          );
        })}
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <p className="text-sm text-gray-300">
            已選擇 <span className="font-semibold text-blue-400">{selectedFiles.length}</span> 個檔案
          </p>
        </div>
      )}
    </div>
  );
}
