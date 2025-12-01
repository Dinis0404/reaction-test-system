export default function handler(req, res) {
  // 这个路由用于兼容性，实际使用主要的quiz/result接口
  const { sessionId } = req.query;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    results: [],
    summary: {
      score: 0,
      correctCount: 0,
      totalQuestions: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    },
    message: '请使用主结果接口'
  });
}