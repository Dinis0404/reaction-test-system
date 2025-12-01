export default function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sessionData, answers } = req.body;

    if (!sessionData || !answers) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }

    // 更新session数据，记录答案
    const updatedSessionData = {
      ...sessionData,
      answers: answers,
      endTime: new Date().toISOString()
    };

    res.status(200).json({
      sessionData: updatedSessionData,
      message: 'Answers submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting answers:', error);
    res.status(500).json({ 
      error: 'Failed to submit answers',
      message: error.message 
    });
  }
}