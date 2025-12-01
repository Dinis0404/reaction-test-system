export function calculateResults(questions, answers) {
  const results = questions.map(q => {
    const ua = answers.find(a => a.questionId === q.id);
    const selectedIndex = ua && ua.selectedIndex !== null ? ua.selectedIndex : null;
    const isCorrect = selectedIndex === q.correctIndex;
    return {
      questionId: q.id,
      question: q.question || `题目 ${q.id}`,
      choices: q.choices || [],
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation || '暂无解析'
    };
  });
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalQuestions = results.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  return { results, correctCount, totalQuestions, score };
}

export function checkAnswer(questionInfo, selectedIndex, userInput) {
  if (typeof userInput !== 'undefined') {
    const correctAnswer = (questionInfo.choices && questionInfo.choices[0]) || '';
    const isCorrect = String(userInput).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
    return { isCorrect, correctIndex: 0 };
  }
  const isCorrect = selectedIndex === questionInfo.correctIndex;
  return { isCorrect, correctIndex: questionInfo.correctIndex };
}

