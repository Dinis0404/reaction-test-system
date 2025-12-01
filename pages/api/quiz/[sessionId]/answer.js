export default function handler(req, res) {
  // 这个路由用于兼容性，实际使用主要的quiz/answer接口
  const { sessionId } = req.query;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 转发到主答案提交接口
  const { answers } = req.body;
  
  res.status(200).json({
    message: 'Answers submitted successfully',
    sessionId,
    answersCount: answers?.length || 0
  });
}