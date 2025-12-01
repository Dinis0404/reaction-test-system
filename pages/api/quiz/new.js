import fs from 'fs';
import path from 'path';
import { allTxtFiles } from '../../../lib/fileScanner';
import { parseQuestionFile } from '../../../lib/questionParser';

const dataDir = path.join(process.cwd(), 'data');

function readQuestionsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return parseQuestionFile(content, path.basename(filePath));
  } catch (error) {
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
      fileList = allTxtFiles(dataDir);
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
      correctIndex: q.correctIndex,
      explanation: q.explanation || '暂无解析',
      type: q.type || 'multiple_choice'
    }));

    const sessionData = {
      questionIds: cleanQuestions.map(q => q.id),
      startTime: new Date().toISOString(),
      questions: cleanQuestions.map(q => ({
        id: q.id,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        choices: q.choices
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
