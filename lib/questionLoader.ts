/**
 * 题库加载与读取工具 - Vercel兼容版本
 */
import fs from 'fs';
import path from 'path';
import { validateQuestions, ValidatedQuestion } from './questionValidator';
import { parseQuestionFile } from './txtParser';

/**
 * 从指定资料夹读取所有题目文件（支持 JSON 和 TXT）
 * Vercel兼容版本：在构建时预加载题目
 * 支持递归读取子文件夹
 */
export function loadQuestionsFromFolder(folderPath: string = 'data', selectedFiles?: string[]): {
  questions: ValidatedQuestion[];
  errors: Array<{ file: string; errors: Array<{ line: number; reason: string }> }>;
} {
  const questions: ValidatedQuestion[] = [];
  const errors: Array<{ file: string; errors: Array<{ line: number; reason: string }> }> = [];

  try {
    const dataDirectory = path.join(process.cwd(), folderPath);
    
    // Vercel兼容性：检查data目录是否存在
    if (!fs.existsSync(dataDirectory)) {
      console.warn(`资料夹不存在: ${dataDirectory}，尝试使用预加载题目`);
      
      // 在Vercel上，data目录可能不存在，尝试从构建时已知的文件加载
      // 这里可以添加一些示例题目作为fallback
      const fallbackQuestions = [
        {
          id: 1,
          question: "示例题目：1 + 1 = ?",
          choices: ["1", "2", "3", "4"],
          answer: "2",
          explanation: "1 + 1 = 2"
        },
        {
          id: 2,
          question: "示例题目：2 × 3 = ?",
          choices: ["4", "5", "6", "7"],
          answer: "6",
          explanation: "2 × 3 = 6"
        }
      ];
      
      const { valid, invalid } = validateQuestions(fallbackQuestions);
      questions.push(...valid);
      
      if (invalid.length > 0) {
        errors.push({
          file: 'fallback',
          errors: invalid.map(inv => ({ line: 0, reason: inv.reason })),
        });
      }
      
      return { questions, errors };
    }

    // 递归读取所有题目文件
    function readDirectoryRecursive(dirPath: string, relativePath: string = ''): void {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // 递归读取子目录
          const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
          readDirectoryRecursive(itemPath, newRelativePath);
        } else if (stats.isFile() && (item.endsWith('.json') || item.endsWith('.txt'))) {
          // 处理txt和json文件
          const fileDisplayName = relativePath ? `${relativePath}/${item}` : item;
          
          // 如果指定了文件列表，检查是否在列表中
          if (selectedFiles && selectedFiles.length > 0) {
            // 检查是否匹配完整路径或仅文件名
            const isSelected = selectedFiles.some(selectedFile => 
              selectedFile === fileDisplayName || selectedFile === item
            );
            
            if (!isSelected) {
              continue; // 跳过不在选择列表中的文件
            }
          }
          
          try {
            const fileContents = fs.readFileSync(itemPath, 'utf8');
            
            // 使用新的解析器（支持 TXT 和 JSON）
            const { questions: fileQuestions, errors: fileErrors } = parseQuestionFile(fileContents, fileDisplayName);

            if (fileErrors.length > 0) {
              errors.push(...fileErrors);
            }

            // 验证题目
            const { valid, invalid } = validateQuestions(fileQuestions);

            if (invalid.length > 0) {
              errors.push({
                file: fileDisplayName,
                errors: invalid.map(inv => ({ line: 0, reason: inv.reason })),
              });
            }

            questions.push(...valid);

            console.log(`✓ 从 ${fileDisplayName} 加载了 ${valid.length} 道有效题目`);
            if (fileErrors.length > 0 || invalid.length > 0) {
              console.warn(`⚠ ${fileDisplayName} 中有 ${fileErrors.length + invalid.length} 个问题`);
            }
          } catch (error) {
            errors.push({
              file: fileDisplayName,
              errors: [{ 
                line: 0,
                reason: error instanceof Error ? error.message : '读取文件失败' 
              }],
            });
          }
        }
      }
    }

    // 开始递归读取
    readDirectoryRecursive(dataDirectory);

    if (questions.length === 0) {
      throw new Error(`资料夹 ${dataDirectory} 中没有找到题目文件`);
    }

    return { questions, errors };
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? `加载题库失败: ${error.message}` 
        : '加载题库时发生未知错误'
    );
  }
}

/**
 * 从内存中加载题目（用于缓存）
 */
let cachedQuestions: ValidatedQuestion[] | null = null;
let lastLoadTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
let lastCacheKey: string = '';

export function getCachedQuestions(
  folderPath: string = 'data', 
  forceReload: boolean = false,
  selectedFiles?: string[]
): {
  questions: ValidatedQuestion[];
  errors: Array<{ file: string; errors: Array<{ line: number; reason: string }> }>;
} {
  const now = Date.now();
  const cacheKey = selectedFiles ? selectedFiles.sort().join(',') : 'all';

  // 如果文件列表改变，强制重新加载
  if (forceReload || !cachedQuestions || (now - lastLoadTime > CACHE_DURATION) || cacheKey !== lastCacheKey) {
    console.log(`缓存失效，重新加载题目。缓存键: ${cacheKey}, 上次缓存键: ${lastCacheKey}`);
    const result = loadQuestionsFromFolder(folderPath, selectedFiles);
    cachedQuestions = result.questions;
    lastLoadTime = now;
    lastCacheKey = cacheKey;
    console.log(`加载了 ${result.questions.length} 道题目`);
    return result;
  }

  console.log(`使用缓存题目。缓存键: ${cacheKey}, 题目数量: ${cachedQuestions.length}`);
  return { questions: cachedQuestions, errors: [] };
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  cachedQuestions = null;
  lastLoadTime = 0;
}

