export default function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sessionData, questionId, selectedIndex, userInput } = req.body;

    if (!sessionData || !questionId) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }

    // 查找题目信息
    const questionInfo = sessionData.questions?.find(q => q.id === questionId);
    
    if (!questionInfo) {
      return res.status(404).json({ 
        error: 'Question not found in session data' 
      });
    }

    const { isCorrect, correctIndex } = checkAnswer(questionInfo, selectedIndex, userInput);

    res.status(200).json({
      questionId,
      selectedIndex,
      correctIndex,
      isCorrect,
      explanation: questionInfo.explanation || '答案正确'
    });

  } catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({ 
      error: 'Failed to check answer',
      message: error.message 
    });
  }
}
import { checkAnswer } from '../../../lib/resultUtils';
