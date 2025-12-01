import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

// 解析题目文件内容
function parseQuestionFile(content, fileName) {
  const lines = content.split('\n').filter(line => line.trim());
  const questions = [];
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.match(/^\d+\./)) {
      // 新题目开始
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      
      currentQuestion = {
        id: Date.now() + i, // 简单生成唯一ID
        question: line.replace(/^\d+\.\s*/, ''),
        choices: [],
        correctIndex: null,
        explanation: '',
        type: 'multiple_choice'
      };
    } else if (line.startsWith('A.') || line.startsWith('B.') || line.startsWith('C.') || line.startsWith('D.')) {
      // 选项
      if (currentQuestion) {
        const choiceText = line.substring(2).trim();
        currentQuestion.choices.push(choiceText);
        
        // 如果选项包含*号，表示这是正确答案
        if (choiceText.includes('*')) {
          currentQuestion.correctIndex = currentQuestion.choices.length - 1;
          currentQuestion.choices[currentQuestion.choices.length - 1] = choiceText.replace('*', '').trim();
        }
      }
    } else if (line.startsWith('答案：')) {
      // 答案行
      if (currentQuestion) {
        const answerMatch = line.match(/答案：\s*([A-D])/i);
        if (answerMatch) {
          const answerChar = answerMatch[1].toUpperCase();
          currentQuestion.correctIndex = 'ABCD'.indexOf(answerChar);
        }
      }
    } else if (line.startsWith('解析：')) {
      // 解析
      if (currentQuestion) {
        currentQuestion.explanation = line.substring(3).trim();
      }
    } else if (line.includes('_____') || line.includes('_') && line.includes('=')) {
      // 填空题
      if (currentQuestion) {
        const match = line.match(/^(.+)\s*=\s*(.+)$/);
        if (match) {
          currentQuestion.question = match[1].trim();
          currentQuestion.answer = match[2].trim();
          currentQuestion.type = 'fill_blank';
          currentQuestion.choices = [];
        }
      }
    } else if (currentQuestion && currentQuestion.question) {
      // 可能是题目的续行
      currentQuestion.question += ' ' + line;
    }
  }

  // 添加最后一个题目
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions.filter(q => q.question && q.type === 'multiple_choice' ? q.choices.length >= 2 : true);
}

// 从文件中读取题目
function readQuestionsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return parseQuestionFile(content, path.basename(filePath));
  } catch (error) {
    console.error('Error reading file:', filePath, error);
    return [];
  }
}

export default function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { files, count } = req.query;
    
    let fileList = [];
    if (files) {
      fileList = files.split(',').map(f => f.trim());
    } else {
      // 如果没有指定文件，读取所有题目文件
      const allFiles = [];
      
      function scanDirectory(dir, basePath = '') {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const relativePath = path.join(basePath, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            scanDirectory(itemPath, relativePath);
          } else if (item.endsWith('.txt')) {
            allFiles.push(path.join(dataDir, relativePath));
          }
        }
      }
      
      scanDirectory(dataDir);
      fileList = allFiles;
    }

    // 读取所有题目
    let allQuestions = [];
    for (const filePath of fileList) {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(dataDir, filePath);
      if (fs.existsSync(fullPath)) {
        const questions = readQuestionsFromFile(fullPath);
        allQuestions = allQuestions.concat(questions);
      }
    }

    // 如果指定了数量，随机选择题目
    let selectedQuestions = allQuestions;
    const questionCount = parseInt(count) || 10;
    
    if (allQuestions.length > questionCount) {
      // 随机选择题目
      selectedQuestions = [...allQuestions]
        .sort(() => Math.random() - 0.5)
        .slice(0, questionCount);
    }

    // 为每个题目生成新的ID并清理数据
    const cleanQuestions = selectedQuestions.map((q, index) => ({
      id: index + 1,
      question: q.question,
      choices: q.choices,
      type: q.type || 'multiple_choice'
    }));

    const sessionData = {
      questionIds: cleanQuestions.map(q => q.id),
      startTime: new Date().toISOString(),
      questions: cleanQuestions.map(q => ({
        id: q.id,
        correctIndex: q.correctIndex,
        explanation: q.explanation
      }))
    };

    res.status(200).json({
      sessionData,
      questions: cleanQuestions,
      totalCount: cleanQuestions.length
    });

  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ 
      error: 'Failed to create quiz',
      message: error.message 
    });
  }
}