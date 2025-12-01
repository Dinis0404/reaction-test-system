const fs = require('fs');

// 模拟txtParser的解析函数
function parseTxtQuestions(content) {
  const questions = [];
  const errors = [];
  
  // 按题目分隔（使用 --- 或空行）
  const blocks = content.split(/\n\s*---\s*\n|\n\s*\n\s*\n/).filter(block => block.trim());
  
  blocks.forEach((block, blockIndex) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    try {
      let questionText = '';
      const choices = [];
      let answerText = '';
      let explanation = '';

      let currentLineIndex = 0;

      // 检查是否是填空题（包含____）
      const isFillBlank = lines[0].includes('____');
      
      if (isFillBlank) {
        // 填空题格式：直接获取答案行
        questionText = lines[0];
        currentLineIndex = 1;
        
        for (let i = currentLineIndex; i < lines.length; i++) {
          const line = lines[i];
          
          // 检查是否是答案行（填空题格式：答案：内容）
          if (line.match(/^答案[：:]?\s*(.+)/i)) {
            const match = line.match(/^答案[：:]?\s*(.+)/i);
            if (match) {
              answerText = match[1].trim();
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
          const explanationLines = [];
          for (let i = currentLineIndex; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/^解析[：:]?\s*(.+)/i)) {
              explanationLines.push(line.replace(/^解析[：:]?\s*/i, ''));
            } else if (line.length > 0) {
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
        
      }

    } catch (error) {
      errors.push({
        line: blockIndex + 1,
        reason: error instanceof Error ? error.message : '解析错误',
      });
    }
  });

  return {
    questions,
    errors,
  };
}

// 读取填空题文件
const content = fs.readFileSync('./data/other/fill_blank_example.txt', 'utf8');
console.log('=== 文件内容 ===');
console.log(content);

console.log('\n=== 解析结果 ===');
const result = parseTxtQuestions(content);
console.log('解析出的题目数量:', result.questions.length);

result.questions.forEach((q, i) => {
  console.log(`\n题目 ${i + 1}:`);
  console.log('  题目:', q.question);
  console.log('  选项:', q.choices);
  console.log('  答案索引:', q.answerIndex);
  console.log('  解析:', q.explanation);
});

if (result.errors.length > 0) {
  console.log('\n=== 解析错误 ===');
  result.errors.forEach(error => {
    console.log(`第${error.line}行: ${error.reason}`);
  });
}

console.log('\n=== 解析完成 ===');