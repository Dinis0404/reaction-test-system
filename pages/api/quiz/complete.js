export default function handler(req, res) {
  console.log('收到 /api/quiz/complete 請求');
  
  try {
    if (req.method !== 'POST') {
      console.log('錯誤：不支持的請求方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sessionData, answers } = req.body;
    console.log('請求體數據:', { 
      hasSessionData: !!sessionData, 
      hasAnswers: !!answers,
      answersLength: answers ? answers.length : 0
    });

    if (!sessionData || !answers) {
      console.log('錯誤：缺少必要參數', { sessionData: !!sessionData, answers: !!answers });
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }

    // 驗證會話數據
    console.log('驗證會話數據:', { 
      sessionDataKeys: Object.keys(sessionData),
      questionsCount: sessionData.questions ? sessionData.questions.length : 0
    });
    
    if (!sessionData.questions || !Array.isArray(sessionData.questions)) {
      console.log('錯誤：會話數據無效');
      return res.status(400).json({ 
        error: 'Invalid session data: missing questions' 
      });
    }

    // 驗證答案數據
    console.log('驗證答案數據:', { 
      isAnswersArray: Array.isArray(answers),
      answersCount: Array.isArray(answers) ? answers.length : 0
    });
    
    if (!Array.isArray(answers)) {
      console.log('錯誤：答案格式無效');
      return res.status(400).json({ 
        error: 'Invalid answers format: must be an array' 
      });
    }

    console.log('開始處理答案提交請求');
    console.log('會話數據中的題目數量:', sessionData.questions.length);
    console.log('提交的答案數量:', answers.length);

    const { results, correctCount, totalQuestions, score } = calculateResults(sessionData.questions, answers);

    console.log('計算結果:', { correctCount, totalQuestions, score });

    // 準備返回的會話數據
    const updatedSessionData = {
      ...sessionData,
      answers: answers,
      results: results,
      resultsCalculated: true,
      score: score,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      endTime: new Date().toISOString()
    };

    // 返回結果
    res.status(200).json({
      message: 'Quiz completed successfully',
      results,
      summary: {
        score,
        correctCount,
        totalQuestions,
        startTime: sessionData.startTime,
        endTime: updatedSessionData.endTime
      },
      sessionData: updatedSessionData
    });

  } catch (error) {
    console.error('處理答案提交時發生錯誤:', error);
    res.status(500).json({ 
      error: 'Failed to process answers',
      message: error.message 
    });
  }
}
import { calculateResults } from '../../../lib/resultUtils';
