import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionStorage, QuizAnswer, QuizSessionData } from '@/lib/sessionStorage';

interface Question {
  id: number;
  choices: string[];
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许，仅支持 POST' });
  }

  try {
    const { sessionData, answers } = req.body;

    if (!sessionData) {
      return res.status(400).json({ error: '缺少 sessionData 参数' });
    }

    if (!answers) {
      return res.status(400).json({ error: '缺少 answers 字段' });
    }

    // 验证session数据
    if (!sessionStorage.validateSession(sessionData)) {
      return res.status(400).json({ error: 'Session 数据无效或已过期' });
    }

    if (sessionData.submitted) {
      return res.status(400).json({ error: '测验已提交，无法修改答案' });
    }

    // 支持单题答案或批量答案
    let answerArray: QuizAnswer[];

    if (Array.isArray(answers)) {
      // 批量提交
      answerArray = answers;
    } else if (typeof answers === 'object' && answers.questionId !== undefined && answers.selectedIndex !== undefined) {
      // 单题提交
      answerArray = [answers];
    } else {
      return res.status(400).json({ error: '答案格式不正确' });
    }

    // 验证答案格式
    for (const answer of answerArray) {
      if (typeof answer.questionId !== 'number' || answer.questionId < 0) {
        return res.status(400).json({ 
          error: '答案格式错误',
          details: `questionId 必须是大于等于0的数字，收到: ${answer.questionId}`,
        });
      }

      if (typeof answer.selectedIndex !== 'number' || answer.selectedIndex < 0) {
        return res.status(400).json({ 
          error: '答案格式错误',
          details: `selectedIndex 必须是大于等于0的数字，收到: ${answer.selectedIndex}`,
        });
      }

      // 检查题目是否存在
      const question = sessionData.questions.find((q: Question) => q.id === answer.questionId);
      if (!question) {
        return res.status(400).json({ 
          error: '答案格式错误',
          details: `题目 ${answer.questionId} 不存在于此 session`,
        });
      }

      // 检查 selectedIndex 是否在有效范围内
      if (answer.selectedIndex >= question.choices.length) {
        return res.status(400).json({ 
          error: '答案格式错误',
          details: `题目 ${answer.questionId} 的 selectedIndex (${answer.selectedIndex}) 超出选项范围 [0-${question.choices.length - 1}]`,
        });
      }
    }

    // 提交答案并返回更新后的session数据
    const updatedSessionData = sessionStorage.submitAnswers(sessionData, answerArray);

    res.status(200).json({
      success: true,
      message: '答案已保存',
      submittedCount: answerArray.length,
      sessionData: updatedSessionData,
    });
  } catch (error) {
    console.error('提交答案错误:', error);
    res.status(500).json({ 
      error: '提交答案失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
}




