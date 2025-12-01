export default function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sessionData } = req.body;

    if (!sessionData) {
      return res.status(400).json({ 
        error: 'Missing session data' 
      });
    }

    // 计算分数和结果
    const results = sessionData.questions?.map(question => {
      const userAnswer = sessionData.answers?.find(a => a.questionId === question.id);
      const selectedIndex = userAnswer?.selectedIndex ?? null;
      const isCorrect = selectedIndex === question.correctIndex;

      return {
        questionId: question.id,
        question: question.question || `题目 ${question.id}`,
        choices: question.choices || [],
        selectedIndex,
        correctIndex: question.correctIndex,
        isCorrect,
        explanation: question.explanation || '暂无解析'
      };
    }) || [];

    const correctCount = results.filter(r => r.isCorrect).length;
    const totalQuestions = results.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const updatedSessionData = {
      ...sessionData,
      resultsCalculated: true,
      score: score,
      correctCount: correctCount,
      totalQuestions: totalQuestions
    };

    res.status(200).json({
      results,
      summary: {
        score,
        correctCount,
        totalQuestions,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime || new Date().toISOString()
      },
      sessionData: updatedSessionData
    });

  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({ 
      error: 'Failed to get results',
      message: error.message 
    });
  }
}