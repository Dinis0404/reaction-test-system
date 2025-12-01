import { useRef, useState, useEffect } from 'react';

interface QuestionCardProps {
  question: {
    id: number;
    question: string;
    choices: string[];
    type?: 'multiple_choice' | 'fill_blank';
  };
  selectedAnswer: number | null;
  onAnswerSelect: (questionId: number, answerIndex: number, userInput?: string, shouldValidate?: boolean) => void;
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
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 专门用于保存填空题用户输入的内容
  const [fillBlankInput, setFillBlankInput] = useState('');
  
  // 添加 useEffect 在题目改变时重置填空题输入
  useEffect(() => {
    // 当题目改变时，重置填空题的输入内容
    setFillBlankInput('');
  }, [question.id]);
  
  // 检测题目类型：如果题目包含 ____ 则为填空题
  const isFillBlank = question.type === 'fill_blank' || question.question.includes('____');

  // 填空题处理逻辑
  if (isFillBlank) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mb-6 border border-gray-700 hover:shadow-2xl transition-shadow duration-300">
        <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-6 leading-relaxed">
          {question.question}
        </h3>
        
        {/* 填空题输入区域 */}
        <div className="space-y-4">
          {!showResult && !immediateCheck ? (
            // 答题模式：显示输入框
            <div className="flex items-center space-x-3">
            <input
              type="text"
              ref={inputRef}
              value={fillBlankInput}
              onChange={(e) => {
                // 只更新本地输入框的值，不触发任何答案选择
                const userInput = e.target.value;
                setFillBlankInput(userInput);
                
                // 重要：对于填空题，我们不在这里调用 onAnswerSelect
                // 因为每次输入都会触发答案检查，导致自动判断问题
                // 只有当用户主动提交时才触发验证
              }}
              onKeyDown={(e) => {
                // 监听Enter键
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // 只有当用户按Enter键时才触发验证
                  const userInput = e.currentTarget.value.trim();
                  if (userInput !== '') {
                    onAnswerSelect(question.id, 0, userInput, true);
                  }
                }
              }}
              placeholder="請輸入答案（按Enter鍵提交）"
              className="flex-1 p-4 rounded-lg border-2 border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={showResult || immediateCheck}
            />
            <button
              onClick={() => {
                // 点击提交按钮时触发验证
                const userInput = fillBlankInput.trim();
                if (userInput !== '') {
                  onAnswerSelect(question.id, 0, userInput, true);
                }
              }}
              disabled={showResult || immediateCheck || fillBlankInput.trim() === ''}
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              提交
            </button>
            </div>
          ) : (
            // 结果模式：显示用户答案和正确答案
            <div className="space-y-4">
              {userAnswer !== null && (
                <div className="flex items-center p-4 rounded-lg border-2 bg-gray-700 border-gray-600 text-gray-200">
                  <span className="font-semibold mr-3">您的答案：</span>
                  <span>{
                    // 对于填空题，直接显示用户输入的内容
                    // 如果本地状态中有用户输入内容，则显示本地内容
                    // 否则显示从selectedAnswer中读取的内容
                    // 如果 userAnswer 有值但具体答案内容为空，说明应该查找 userAnswer 对应的答案
                    fillBlankInput && fillBlankInput !== '' ? fillBlankInput :
                    (selectedAnswer !== null && question.choices[selectedAnswer] ? 
                      question.choices[selectedAnswer] : 
                    (userAnswer !== null && question.choices[userAnswer] ?
                      question.choices[userAnswer] : '无答案'))
                  }</span>
                  <span className="ml-3 text-2xl">
                    {userAnswer === correctAnswer ? '✅' : '❌'}
                  </span>
                </div>
              )}
              {correctAnswer !== undefined && (
                <div className="flex items-center p-4 rounded-lg border-2 bg-green-900/30 border-green-500 text-green-200">
                  <span className="font-semibold mr-3">正确答案：</span>
                  <span>{question.choices[correctAnswer]}</span>
                  <span className="ml-3 text-2xl">✅</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 填空题答案区域 */}
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
            
            {/* 显示正确答案 */}
            {correctAnswer !== undefined && (
              <div className="mt-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <p className="text-blue-300 text-sm font-semibold">正确答案：{question.choices[correctAnswer]}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 选择题处理逻辑（保持原有代码）
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

