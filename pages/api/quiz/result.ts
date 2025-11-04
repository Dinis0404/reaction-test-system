import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionStorage, QuizSessionData } from '@/lib/sessionStorage';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许，仅支持 POST' });
  }

  try {
    const { sessionData } = req.body;

    if (!sessionData) {
      return res.status(400).json({ error: '缺少 sessionData 参数' });
    }

    console.log('获取结果请求 - Session ID:', sessionData.sessionId);
    console.log('获取结果请求 - 题目数量:', sessionData.questions?.length);
    console.log('获取结果请求 - 答案数量:', sessionData.answers?.length);

    // 验证session数据
    if (!sessionStorage.validateSession(sessionData)) {
      console.error('Session 验证失败');
      return res.status(400).json({ error: 'Session 数据无效或已过期' });
    }

    // 获取结果
    const result = sessionStorage.getSessionResult(sessionData);

    if (!result) {
      console.error('无法获取结果');
      return res.status(404).json({ error: '无法获取结果' });
    }

    console.log('计算结果 - 正确数:', result.correctCount, '总题数:', result.totalQuestions, '得分:', result.score);

    // 标记为已提交（如果还没有）
    if (!result.session.submitted) {
      const updatedSessionData = sessionStorage.markAsSubmitted(sessionData);
      result.session = updatedSessionData;
    }

    const response = {
      sessionId: result.session.sessionId,
      score: result.score,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      submitted: result.session.submitted,
      submittedAt: result.session.submittedAt,
      results: result.results,
      sessionData: result.session,
    };

    console.log('返回结果 - 结果数量:', response.results.length);
    console.log('返回结果 - 正确数量:', response.correctCount);
    console.log('返回结果 - 得分:', response.score);

    res.status(200).json(response);
  } catch (error) {
    console.error('获取结果错误:', error);
    res.status(500).json({ 
      error: '获取结果失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
}