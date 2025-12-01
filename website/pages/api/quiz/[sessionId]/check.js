export default function handler(req, res) {
  // 这个路由用于兼容性，实际使用主要的quiz/check接口
  const { sessionId } = req.query;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 转发到主检查接口
  const { questionId, selectedIndex, userInput } = req.body;
  
  res.status(200).json({
    questionId,
    selectedIndex,
    correctIndex: 0, // 占位符
    isCorrect: false,
    explanation: '请使用主检查接口'
  });
}