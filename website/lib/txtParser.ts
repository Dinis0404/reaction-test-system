/**
 * TXT 题目格式解析器
 * 
 * 支持的格式示例：
 * 
 * 选择题格式：
 * 题目1：JavaScript 中哪个方法用于向数组末尾添加元素？
 * A. push()
 * B. pop()
 * C. shift()
 * D. unshift()
 * 答案：A
 * 解析：push() 方法用于向数组末尾添加一个或多个元素。
 * 
 * ---
 * 
 * 填空题格式：
 * 1. 水在攝氏____度時結冰
 * 答案：0
 * 
 * 2. 中國的首都是____
 * 答案：北京
 */
import { ValidatedQuestion } from './questionValidator';

interface ParsedQuestion {
  id: number;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

/**
 * 解析 TXT 格式的题目文件
 */
export function parseTxtQuestions(content: string, filename: string = 'unknown.txt'): {
  questions: ValidatedQuestion[];
  errors: Array<{ line: number; reason: string }>;
} {
  const questions: ParsedQuestion[] = [];
  const errors: Array<{ line: number; reason: string }> = [];
  
  // 按题目分隔（使用 --- 或空行）
  const blocks = content.split(/\n\s*---\s*\n|\n\s*\n\s*\n/).filter(block => block.trim());
  
  blocks.forEach((block, blockIndex) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    try {
      let questionText = '';
      const choices: string[] = [];
      let answerText = '';
      let explanation = '';

      let currentLineIndex = 0;

      // 解析题目
      // 格式：题目X：题目内容 或直接是题目内容
      const firstLine = lines[0];
      if (firstLine.includes('：') || firstLine.includes(':')) {
        const match = firstLine.match(/^题目\d+[：:]?\s*(.+)/) || firstLine.match(/^(.+)$/);
        if (match) {
          questionText = match[1].trim();
          currentLineIndex = 1;
        }
      } else {
        questionText = firstLine;
        currentLineIndex = 1;
      }

      // 检查是否是填空题（包含____）
      const isFillBlank = questionText.includes('____');
      
      if (isFillBlank) {
        // 填空题格式：直接获取答案行
        for (let i = currentLineIndex; i < lines.length; i++) {
          const line = lines[i];
          
          // 检查是否是答案行（填空题格式：答案：内容）
          if (line.match(/^答案[：:]?\s*(.+)/i)) {
            const match = line.match(/^答案[：:]?\s*(.+)/i);
            if (match) {
              answerText = match[1].trim();
              // 将填空题的答案作为唯一的选项
              choices.push(answerText);
              currentLineIndex = i + 1;
            }
            break;
          }
        }
        
        // 答案索引始终为0，因为填空题只有一个选项
        const answerIndex = 0;
        
        // 解析解析/解释（答案后面的内容）
        if (currentLineIndex < lines.length) {
          const explanationLines: string[] = [];
          for (let i = currentLineIndex; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/^解析[：:]?\s*(.+)/i)) {
              explanationLines.push(line.replace(/^解析[：:]?\s*/i, ''));
            } else if (line.length > 0) {
              // 答案行之后的所有非空行都视为解析
              if (answerText || explanationLines.length > 0) {
                explanationLines.push(line);
              }
            }
          }
          explanation = explanationLines.join(' ').trim();
        }
        
        // 验证填空题
        if (!questionText) {
          errors.push({ line: blockIndex + 1, reason: '缺少题目内容' });
          return;
        }

        if (!answerText) {
          errors.push({ line: blockIndex + 1, reason: '缺少答案' });
          return;
        }

        questions.push({
          id: questions.length + 1,
          question: questionText,
          choices,
          answerIndex,
          explanation: explanation || '暂无解析',
        });
        
      } else {
        // 选择题格式
        // 解析选项（A. B. C. D. 格式）
        for (let i = currentLineIndex; i < lines.length; i++) {
          const line = lines[i];
          
          // 检查是否是答案行
          if (line.match(/^答案[：:]?\s*([A-Z])/i)) {
            const match = line.match(/^答案[：:]?\s*([A-Z])/i);
            if (match) {
              answerText = match[1].toUpperCase();
              currentLineIndex = i + 1;
            }
            break;
          }

          // 检查是否是选项行
          const choiceMatch = line.match(/^([A-Z])[.)]\s*(.+)/);
          if (choiceMatch) {
            const choiceText = choiceMatch[2].trim();
            choices.push(choiceText);
          } else {
            // 如果遇到非选项行，可能是答案或解析
            if (line.match(/^答案/i)) {
              const match = line.match(/^答案[：:]?\s*([A-Z])/i);
              if (match) {
                answerText = match[1].toUpperCase();
                currentLineIndex = i + 1;
              }
              break;
            }
          }
          currentLineIndex = i + 1;
        }

        // 解析解析/解释（答案后面的内容）
        if (currentLineIndex < lines.length) {
          const explanationLines: string[] = [];
          for (let i = currentLineIndex; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/^解析[：:]?\s*(.+)/i)) {
              explanationLines.push(line.replace(/^解析[：:]?\s*/i, ''));
            } else if (line.length > 0) {
              // 答案行之后的所有非空行都视为解析
              if (answerText || explanationLines.length > 0) {
                explanationLines.push(line);
              }
            }
          }
          explanation = explanationLines.join(' ').trim();
        }

        // 验证选择题
        if (!questionText) {
          errors.push({ line: blockIndex + 1, reason: '缺少题目内容' });
          return;
        }

        if (choices.length < 2) {
          errors.push({ line: blockIndex + 1, reason: '选项数量不足（至少需要2个选项）' });
          return;
        }

        if (!answerText) {
          errors.push({ line: blockIndex + 1, reason: '缺少答案' });
          return;
        }

        const answerIndex = answerText.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        if (answerIndex < 0 || answerIndex >= choices.length) {
          errors.push({ line: blockIndex + 1, reason: `答案 ${answerText} 超出选项范围` });
          return;
        }

        questions.push({
          id: questions.length + 1,
          question: questionText,
          choices,
          answerIndex,
          explanation: explanation || '暂无解析',
        });
      }

    } catch (error) {
      errors.push({
        line: blockIndex + 1,
        reason: error instanceof Error ? error.message : '解析错误',
      });
    }
  });

  // 转换为 ValidatedQuestion 格式
  const validatedQuestions: ValidatedQuestion[] = questions
    .filter(q => {
      // 检测是否是填空题
      const isFillBlank = q.question.includes('____');
      // 填空题只需要1个选项，选择题需要至少2个选项
      const minChoices = isFillBlank ? 1 : 2;
      
      return q.choices.length >= minChoices && q.answerIndex >= 0 && q.answerIndex < q.choices.length;
    })
    .map(q => ({
      id: q.id,
      question: q.question.trim(),
      choices: q.choices.map(c => c.trim()),
      answerIndex: q.answerIndex,
      explanation: q.explanation,
    }));

  return {
    questions: validatedQuestions,
    errors,
  };
}

/**
 * 从文件内容解析题目（支持多种格式）
 */
export function parseQuestionFile(content: string, filename: string): {
  questions: ValidatedQuestion[];
  errors: Array<{ file: string; errors: Array<{ line: number; reason: string }> }>;
} {
  const errors: Array<{ file: string; errors: Array<{ line: number; reason: string }> }> = [];
  
  if (filename.endsWith('.txt')) {
    const result = parseTxtQuestions(content, filename);
    if (result.errors.length > 0) {
      errors.push({ file: filename, errors: result.errors });
    }
    return {
      questions: result.questions,
      errors,
    };
  } else if (filename.endsWith('.json')) {
    try {
      const jsonData = JSON.parse(content);
      if (!Array.isArray(jsonData)) {
        errors.push({
          file: filename,
          errors: [{ line: 0, reason: 'JSON 格式错误：必须是数组' }],
        });
        return { questions: [], errors };
      }

      const questions: ValidatedQuestion[] = jsonData
        .map((q: any, index: number) => ({
          id: q.id ?? index + 1,
          question: q.question || q.题目 || '',
          choices: q.choices || q.options || [],
          answerIndex: q.answerIndex ?? q.correctAnswer ?? 0,
          explanation: q.explanation || q.解析 || '暂无解析',
        }))
        .filter((q: any) => q.question && Array.isArray(q.choices) && q.choices.length >= 2);

      return { questions, errors };
    } catch (error) {
      errors.push({
        file: filename,
        errors: [{ line: 0, reason: `JSON 解析错误: ${error instanceof Error ? error.message : '未知错误'}` }],
      });
      return { questions: [], errors };
    }
  } else {
    errors.push({
      file: filename,
      errors: [{ line: 0, reason: '不支持的文件格式，仅支持 .txt 和 .json' }],
    });
    return { questions: [], errors };
  }
}




