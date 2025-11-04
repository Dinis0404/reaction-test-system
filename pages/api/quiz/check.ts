import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionStorage, QuizSessionData } from '@/lib/sessionStorage';

interface Question {
  id: number;
  shuffledAnswerIndex: number;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許，僅支援 POST' });
  }

  try {
    const { sessionData, questionId, selectedIndex } = req.body;

    if (!sessionData) {
      return res.status(400).json({ error: '缺少 sessionData 參數' });
    }

    if (typeof questionId !== 'number' || typeof selectedIndex !== 'number') {
      return res.status(400).json({ error: '參數格式錯誤' });
    }

    // 验证session数据
    if (!sessionStorage.validateSession(sessionData)) {
      return res.status(400).json({ error: 'Session 數據無效或已過期' });
    }

    const question = sessionData.questions.find((q: Question) => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: '題目不存在' });
    }

    const isCorrect = selectedIndex === question.shuffledAnswerIndex;
    // 优先从题目对象本身获取解析，如果不存在再从sessionData.explanations中获取
    const explanation = question.explanation || 
                      (sessionData.explanations && sessionData.explanations[questionId]) || 
                      '暫無解析';

    // 调试日志：检查解析是否正确传递
    console.log(`检查答案 - 题目ID: ${questionId}, 选择: ${selectedIndex}, 正确答案: ${question.shuffledAnswerIndex}, 是否正确: ${isCorrect}`);
    console.log(`解析内容: ${explanation}`);

    res.status(200).json({
      isCorrect,
      correctIndex: question.shuffledAnswerIndex,
      explanation,
    });
  } catch (error) {
    console.error('檢查答案錯誤:', error);
    res.status(500).json({ 
      error: '檢查答案失敗',
      message: error instanceof Error ? error.message : '未知錯誤',
    });
  }
}