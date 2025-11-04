interface QuestionCardProps {
  question: {
    id: number;
    question: string;
    choices: string[];
  };
  selectedAnswer: number | null;
  onAnswerSelect: (questionId: number, answerIndex: number) => void;
  showResult?: boolean;
  correctAnswer?: number;
  userAnswer?: number | null;
  explanation?: string;
  immediateCheck?: boolean;
  isCorrect?: boolean;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  showResult = false,
  correctAnswer,
  userAnswer,
  explanation,
  immediateCheck = false,
  isCorrect,
}: QuestionCardProps) {
  const getOptionClass = (index: number) => {
    let baseClass = 'flex items-start p-4 rounded-lg border-2 transition-all duration-200 ';
    
    if (showResult) {
      // 显示结果时的样式
      if (index === correctAnswer) {
        baseClass += 'bg-green-900/30 border-green-500 text-green-200';
      } else if (index === userAnswer && index !== correctAnswer) {
        baseClass += 'bg-red-900/30 border-red-500 text-red-200';
      } else {
        baseClass += 'bg-gray-700 border-gray-600 text-gray-400';
      }
    } else {
      // 答题时的样式
      if (immediateCheck && selectedAnswer === index) {
        // 立即檢查模式下的樣式
        if (isCorrect) {
          baseClass += 'bg-green-900/40 border-green-500 text-green-200 cursor-pointer';
        } else {
          baseClass += 'bg-red-900/40 border-red-500 text-red-200 cursor-pointer';
        }
      } else if (selectedAnswer === index) {
        baseClass += 'bg-blue-900/30 border-blue-500 text-blue-200 cursor-pointer';
      } else {
        baseClass += 'bg-gray-700 border-gray-600 text-gray-200 hover:border-blue-500 hover:bg-gray-700/50 cursor-pointer';
      }
    }
    
    return baseClass;
  };

  const isOptionCorrect = showResult && correctAnswer !== undefined && correctAnswer === userAnswer;

  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mb-6 border border-gray-700 hover:shadow-2xl transition-shadow duration-300">
      <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-6 leading-relaxed">
        {question.question}
      </h3>
      
      <div className="space-y-3" role="radiogroup" aria-label="選項">
        {question.choices.map((choice, index) => (
          <label
            key={index}
            className={getOptionClass(index)}
            onClick={() => !showResult && !immediateCheck && onAnswerSelect(question.id, index)}
            role="radio"
            aria-checked={selectedAnswer === index}
            tabIndex={showResult ? -1 : 0}
            style={{ cursor: showResult || immediateCheck ? 'not-allowed' : 'pointer' }}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={index}
              checked={selectedAnswer === index}
              onChange={() => !showResult && !immediateCheck && onAnswerSelect(question.id, index)}
              className="mt-1 mr-3 w-5 h-5 text-blue-500 focus:ring-blue-500 focus:ring-2 cursor-pointer bg-gray-700 border-gray-600"
              disabled={showResult || immediateCheck}
              aria-label={`選項 ${String.fromCharCode(65 + index)}: ${choice}`}
            />
            <div className="flex-1">
              <span className="font-semibold mr-2">
                {String.fromCharCode(65 + index)}.
              </span>
              <span>{choice}</span>
              {showResult && index === correctAnswer && (
                <span className="ml-2 text-green-400 font-semibold" aria-label="正確答案">✓</span>
              )}
              {immediateCheck && selectedAnswer === index && (
                <span className="ml-2 text-2xl" aria-label={isCorrect ? "正確" : "錯誤"}>
                  {isCorrect ? '✅' : '❌'}
                </span>
              )}
              {immediateCheck && !showResult && index === correctAnswer && index !== selectedAnswer && (
                <span className="ml-2 text-green-400 font-semibold" aria-label="正確答案">✓</span>
              )}
            </div>
          </label>
        ))}
      </div>

      {((showResult || immediateCheck) && explanation) && (
        <div 
          className={`mt-6 p-5 rounded-xl border-2 shadow-md ${
            immediateCheck ? 
              (isCorrect ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500' : 'bg-gradient-to-br from-red-900/40 to-rose-900/40 border-red-500') :
              (userAnswer !== null && userAnswer === correctAnswer ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500' : 'bg-gradient-to-br from-red-900/40 to-rose-900/40 border-red-500')
          }`}
          role="alert"
        >
          <div className="flex items-center mb-2">
            <span className={`text-3xl mr-2 ${
              immediateCheck ? 
                (isCorrect ? 'text-green-400' : 'text-red-400') :
                (userAnswer !== null && userAnswer === correctAnswer ? 'text-green-400' : 'text-red-400')
            }`}>
              {immediateCheck ? 
                (isCorrect ? '✅' : '❌') :
                (userAnswer !== null && userAnswer === correctAnswer ? '✅' : '❌')
            }</span>
            <p className={`font-bold text-lg ${
              immediateCheck ? 
                (isCorrect ? 'text-green-300' : 'text-red-300') :
                (userAnswer !== null && userAnswer === correctAnswer ? 'text-green-300' : 'text-red-300')
            }`}>
              {immediateCheck ? 
                (isCorrect ? '答對了！' : '答錯了') :
                (userAnswer !== null && userAnswer === correctAnswer ? '答對了！' : '答錯了')
            }</p>
          </div>
          <p className="text-sm md:text-base text-gray-300 leading-relaxed ml-10">{explanation}</p>
        </div>
      )}
    </div>
  );
}

