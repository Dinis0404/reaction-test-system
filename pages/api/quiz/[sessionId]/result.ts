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

    // 验证session数据
    if (!sessionStorage.validateSession(sessionData)) {
      return res.status(400).json({ error: 'Session 数据无效或已过期' });
    }

    // 获取结果
    const result = sessionStorage.getSessionResult(sessionData);

    if (!result) {
      return res.status(404).json({ error: '无法获取结果' });
    }

    // 标记为已提交（如果还没有）
    if (!result.session.submitted) {
      const updatedSessionData = sessionStorage.markAsSubmitted(sessionData);
      result.session = updatedSessionData;
    }

    res.status(200).json({
      sessionId: result.session.sessionId,
      score: result.score,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      submitted: result.session.submitted,
      submittedAt: result.session.submittedAt,
      results: result.results,
      sessionData: result.session, // 返回更新后的session数据
    });
  } catch (error) {
    console.error('获取结果错误:', error);
    res.status(500).json({ 
      error: '获取结果失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
}




