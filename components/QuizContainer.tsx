import { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import FileSelector from './FileSelector';

interface Question {
  id: number;
  question: string;
  choices: string[];
}

interface QuizResult {
  questionId: number;
  question: string;
  choices: string[];
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
}

interface QuestionAnswer {
  questionId: number;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
  checked: boolean;
}

interface QuizContainerProps {
  selectedFolder?: string;
}

export default function QuizContainer({ selectedFolder = 'all' }: QuizContainerProps) {
  const [sessionData, setSessionData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [originalResults, setOriginalResults] = useState<QuizResult[] | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showFileSelector, setShowFileSelector] = useState(true);
  const [questionAnswers, setQuestionAnswers] = useState<Map<number, QuestionAnswer>>(new Map());
  const [useAllQuestions, setUseAllQuestions] = useState(false); // 是否使用所有题目

  useEffect(() => {
    // 不自动开始，等待用户选择文件
  }, []);

  const startNewQuiz = async (count?: number, files?: string[]) => {
    try {
      setLoading(true);
      setError(null);
      setShowFileSelector(false);
      
      // 构建URL参数对象
      const params = new URLSearchParams();
      
      // 文件参数
      const filesToUse = files || selectedFiles;
      if (filesToUse.length > 0) {
        params.append('files', filesToUse.join(','));
      }
      
      // 数量参数：只有在不使用所有题目时才传递count
      if (!useAllQuestions) {
        params.append('count', (count || 10).toString());
      }
      
      const queryString = params.toString();
      const url = queryString ? `/api/quiz/new?${queryString}` : '/api/quiz/new';
      
      console.log('请求URL:', url);
      console.log('参数:', {
        useAllQuestions,
        count: useAllQuestions ? 'all' : (count || 10),
        files: filesToUse
      });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API响应错误:', response.status, errorText);
        let errorMessage = '创建测验失败';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `服务器错误 (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // 检查返回的题目数量是否与预期一致
      if (useAllQuestions && data.questions.length === 0) {
        throw new Error('没有找到可用的题目，请检查题库文件');
      }
      
      if (!useAllQuestions && data.questions.length !== (count || 10)) {
        console.warn(`预期 ${count || 10} 题，实际返回 ${data.questions.length} 题`);
      }
      
      console.log('创建测验成功，题目数量:', data.questions.length);
      
      // 保存sessionData用于后续API调用
      setSessionData(data.sessionData);
      setQuestions(data.questions);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setResults(null);

      setQuestionAnswers(new Map());
      setError(null);
    } catch (err) {
      console.error('创建测验错误:', err);
      setError(err instanceof Error ? err.message : '加载题目时发生错误');
      setShowFileSelector(true); // 出错时返回文件选择界面
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (questionId: number, answerIndex: number) => {
    // 立即更新選中的答案
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));

    // 如果是練習模式，直接從原始結果獲取答案
    if (isPracticeMode && originalResults) {
      const originalResult = originalResults.find(r => r.questionId === questionId);
      if (originalResult) {
        const isCorrect = answerIndex === originalResult.correctIndex;
        setQuestionAnswers(prev => {
          const newMap = new Map(prev);
          newMap.set(questionId, {
            questionId,
            selectedIndex: answerIndex,
            correctIndex: originalResult.correctIndex,
            isCorrect,
            explanation: originalResult.explanation,
            checked: true,
          });
          return newMap;
        });
        return;
      }
    }

    // 如果是正式模式，調用API檢查答案
    try {
      const response = await fetch(`/api/quiz/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionData,
          questionId,
          selectedIndex: answerIndex,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API返回的检查结果:', data); // 调试日志
        setQuestionAnswers(prev => {
          const newMap = new Map(prev);
          newMap.set(questionId, {
            questionId,
            selectedIndex: answerIndex,
            correctIndex: data.correctIndex,
            isCorrect: data.isCorrect,
            explanation: data.explanation || '暂无解析',
            checked: true,
          });
          return newMap;
        });
        

      } else {
        // 如果session过期，重新开始
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404 && errorData.error?.includes('Session')) {
          alert('Session已过期，请重新开始练习');
          handleRestart();
        }
      }
    } catch (error) {
      console.error('檢查答案錯誤:', error);
    }
  };



  const submitAllAnswers = async () => {
    // 如果是练习模式，直接显示本地结果
    if (isPracticeMode) {
      const localResults: QuizResult[] = questions.map(q => {
        const selectedIndex = answers[q.id] ?? null;
        const originalResult = originalResults?.find(r => r.questionId === q.id);
        const correctIndex = originalResult?.correctIndex ?? 0;
        
        return {
          questionId: q.id,
          question: q.question,
          choices: q.choices,
          selectedIndex,
          correctIndex,
          isCorrect: selectedIndex === correctIndex,
          explanation: originalResult?.explanation || '暂无解释',
        };
      });
      
      setResults(localResults);
      setIsSubmitting(false);
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      if (!confirm('還有題目未回答，確定要提交所有答案嗎？')) {
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      console.log('开始提交答案...');
      console.log('Session ID:', sessionData?.sessionId);
      console.log('题目数量:', questions.length);
      console.log('答案数量:', Object.keys(answers).length);

      // 提交所有答案 - 只提交用户实际选择的答案
      const answerArray = questions
        .filter(q => answers[q.id] !== undefined) // 只处理有答案的题目
        .map(q => ({
          questionId: q.id,
          selectedIndex: answers[q.id],
        }));

      console.log('提交的答案数组:', answerArray);

      // 提交答案
      const answerResponse = await fetch(`/api/quiz/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionData,
          answers: answerArray,
        }),
      });

      if (!answerResponse.ok) {
        const errorData = await answerResponse.json().catch(() => ({}));
        throw new Error(errorData.error || '提交答案失敗');
      }

      const answerResult = await answerResponse.json();
      console.log('答案提交成功:', answerResult);

      // 更新sessionData
      let updatedSessionData = sessionData;
      if (answerResult.sessionData) {
        updatedSessionData = answerResult.sessionData;
        setSessionData(updatedSessionData);
      }

      // 立即获取结果 - 使用更新后的sessionData
      await fetchResults(updatedSessionData);
    } catch (err) {
      console.error('提交答案錯誤:', err);
      alert('提交答案時發生錯誤: ' + (err instanceof Error ? err.message : '未知錯誤'));
      setIsSubmitting(false);
    }
  };

  const fetchResults = async (customSessionData?: any) => {
    try {
      const sessionDataToUse = customSessionData || sessionData;
      console.log('开始获取结果...');
      console.log('Session ID:', sessionDataToUse?.sessionId);

      const response = await fetch(`/api/quiz/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionData: sessionDataToUse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '獲取結果失敗');
      }

      const data = await response.json();
      console.log('API返回的结果数据:', data);
      
      if (!data.results) {
        throw new Error('结果数据格式不正确');
      }

      // 验证结果数据
      console.log('API返回 - 结果数量:', data.results.length);
      console.log('API返回 - 正确数量:', data.correctCount);
      console.log('API返回 - 得分:', data.score);
      console.log('API返回 - 总题数:', data.totalQuestions);

      // 确保结果数据正确
      const validatedResults = data.results.map((result: any) => ({
        questionId: result.questionId,
        question: result.question,
        choices: result.choices,
        selectedIndex: result.selectedIndex,
        correctIndex: result.correctIndex,
        isCorrect: result.isCorrect,
        explanation: result.explanation || '暂无解释',
      }));


      
      // 设置结果
      setResults(validatedResults);
      setOriginalResults(validatedResults);
      
      // 更新sessionData
      if (data.sessionData) {
        setSessionData(data.sessionData);
      }
      
      console.log('结果获取成功');
    } catch (err) {
      console.error('獲取結果錯誤:', err);
      alert('獲取結果時發生錯誤: ' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setIsPracticeMode(false);
    setOriginalResults(null);
    setShowFileSelector(true);
    setResults(null);
    setQuestions([]);
    setSessionData(null);
    setAnswers({});
    setCurrentQuestionIndex(0);

    setQuestionAnswers(new Map());
  };

  const handleStartQuiz = () => {
    if (selectedFiles.length === 0) {
      alert('請至少選擇一個題目檔案！');
      return;
    }
    // 根据useAllQuestions状态决定是否传递count参数
    if (useAllQuestions) {
      startNewQuiz(undefined, selectedFiles); // 不传count参数，让API返回所有题目
    } else {
      startNewQuiz(10, selectedFiles); // 传count=10，返回10题
    }
  };

  const handlePracticeWrongAnswers = () => {
    if (!results) return;

    const wrongQuestions = results
      .filter(r => !r.isCorrect)
      .map(r => {
        const originalQuestion = questions.find(q => q.id === r.questionId);
        return originalQuestion;
      })
      .filter((q): q is Question => q !== undefined);

    if (wrongQuestions.length === 0) {
      alert('恭喜！您答對了所有題目！');
      return;
    }

    // 进入错题练习模式（本地模式，不使用session）
    setQuestions(wrongQuestions);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResults(null);

    setIsPracticeMode(true);
    setSessionData(null); // 练习模式不需要session
    // 保留 originalResults 以便在练习模式中获取正确答案和解释
  };

  // 显示文件选择界面
  if (showFileSelector && questions.length === 0) {
    return (
      <div className="w-full min-h-[calc(100vh-200px)] flex flex-col">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 md:p-12 mb-6 text-white border border-gray-700 flex-shrink-0">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">開始新練習</h2>
          <p className="text-gray-300 text-lg">請選擇要使用的題目檔案</p>
        </div>

        <div className="flex-1 flex flex-col min-h-0 w-full">
          <div className="flex-1 min-h-0 w-full">
            <FileSelector 
              selectedFiles={selectedFiles}
              onFilesChange={setSelectedFiles}
              selectedFolder={selectedFolder}
            />
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 flex-shrink-0 mt-6 w-full">
            <div className="flex flex-col gap-4">
              {/* 题目数量选择 */}
              <div className="flex items-center justify-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="questionMode"
                    checked={!useAllQuestions}
                    onChange={() => setUseAllQuestions(false)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-200 font-medium">隨機10題</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="questionMode"
                    checked={useAllQuestions}
                    onChange={() => setUseAllQuestions(true)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-200 font-medium">使用所有題目</span>
                </label>
              </div>
              
              {/* 开始练习按钮 */}
              <div className="flex justify-center">
                <button
                  onClick={handleStartQuiz}
                  disabled={selectedFiles.length === 0}
                  className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 min-h-[56px]"
                >
                  {useAllQuestions ? '開始完整練習' : '開始練習'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">加载题目中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 mb-4 font-semibold">{error}</p>
          <button
            onClick={() => startNewQuiz()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (results) {
    // 使用后端返回的结果数据，确保一致性
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalQuestions = results.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    // 调试日志：验证结果数据
    console.log('后端返回结果 - 题目数量:', results.length);
    console.log('后端返回结果 - 正确数量:', correctCount);
    console.log('后端返回结果 - 得分:', score);
    
    // 验证每个题目的结果
    results.forEach((result, index) => {
      console.log(`题目 ${index + 1} (ID: ${result.questionId}): 选择=${result.selectedIndex}, 正确答案=${result.correctIndex}, 是否正确=${result.isCorrect}`);
    });

    return (
      <div className="p-4 md:p-6">
        {/* 分数统计卡片 - 深色主题优化 */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 mb-8 text-center border border-gray-700 relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-pink-900/10"></div>
          
          <div className="relative z-10">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-full mb-6 border border-blue-700/30">
              {score >= 90 ? (
                <svg className="w-20 h-20 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : score >= 70 ? (
                <svg className="w-20 h-20 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-20 h-20 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-4">
              {isPracticeMode ? '錯題練習完成' : '練習完成'}
            </h2>
            
            {/* 分数显示 */}
            <div className="mb-6">
              <div 
                className="text-7xl md:text-8xl font-black mb-2 bg-gradient-to-r bg-clip-text text-transparent"
                style={{
                  backgroundImage: score >= 90 
                    ? 'linear-gradient(to right, #10b981, #059669)' 
                    : score >= 70 
                      ? 'linear-gradient(to right, #f59e0b, #d97706)' 
                      : 'linear-gradient(to right, #ef4444, #dc2626)'
                }}
              >
                {score}
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-300">分</div>
            </div>
            
            {/* 成绩等级 */}
            <div className="mb-6">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                score >= 90 ? 'bg-green-900/30 text-green-300 border border-green-600/30' :
                score >= 80 ? 'bg-blue-900/30 text-blue-300 border border-blue-600/30' :
                score >= 70 ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-600/30' :
                'bg-red-900/30 text-red-300 border border-red-600/30'
              }`}>
                {score >= 90 ? '優秀' : score >= 80 ? '良好' : score >= 70 ? '及格' : '需努力'}
              </span>
            </div>
            
            <p className="text-gray-300 mb-8 text-lg font-medium">
              答對 <span className="font-bold text-blue-400">{correctCount}</span> / <span className="font-bold">{results.length}</span> 題
            </p>
            
            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[56px] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新練習
              </button>
              
              {!isPracticeMode && (
                <button
                  onClick={handlePracticeWrongAnswers}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[56px] flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  練習錯題
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 详细结果 */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700 mb-6">
          <h3 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            詳細結果
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-green-400">{correctCount}</div>
              <div className="text-sm text-gray-400">答對題數</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-red-400">{results.length - correctCount}</div>
              <div className="text-sm text-gray-400">答錯題數</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">{Math.round((correctCount / results.length) * 100)}%</div>
              <div className="text-sm text-gray-400">正確率</div>
            </div>
          </div>
        </div>

        {/* 题目详情 */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            題目詳情
          </h3>
          
          {results.map((result) => {
            const question = questions.find(q => q.id === result.questionId);
            if (!question) return null;
            
            return (
              <QuestionCard
                key={result.questionId}
                question={question}
                selectedAnswer={result.selectedIndex}
                onAnswerSelect={() => {}}
                showResult={true}
                correctAnswer={result.correctIndex}
                userAnswer={result.selectedIndex}
                explanation={result.explanation}
                isCorrect={result.isCorrect}
              />
            );
          })}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const currentQuestionAnswered = currentQuestion && answers[currentQuestion.id] !== undefined;

  return (
    <div className="p-4 md:p-6">
      {/* 进度和题目计数 */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6 mb-6 border border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-lg font-bold text-gray-100">
              第 {currentQuestionIndex + 1} / {questions.length} 題
            </span>
          </div>
          <span className="text-sm font-semibold text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full border border-blue-700">
            {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentQuestionIndex + 1}
            aria-valuemin={1}
            aria-valuemax={questions.length}
          ></div>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          已回答 {answeredCount} / {questions.length} 題
        </div>
      </div>

      {/* 题目卡片 */}
      {currentQuestion && (() => {
        const answerInfo = questionAnswers.get(currentQuestion.id);
        return (
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id] ?? null}
            onAnswerSelect={handleAnswerSelect}
            immediateCheck={answerInfo?.checked ?? false}
            isCorrect={answerInfo?.isCorrect}
            showResult={answerInfo?.checked ?? false}
            correctAnswer={answerInfo?.correctIndex}
            userAnswer={answerInfo?.selectedIndex ?? null}
            explanation={answerInfo?.explanation}
          />
        );
      })()}

      {/* 导航和操作按钮 */}
      <div className="bg-gray-800 rounded-2xl shadow-xl p-4 md:p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-gray-200 rounded-xl hover:from-gray-600 hover:to-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[48px] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            上一題
          </button>

          <div className="flex gap-3 flex-1 justify-center">
            {currentQuestionAnswered && (
              <span className="px-5 py-3 bg-gradient-to-r from-green-900/50 to-emerald-900/50 text-green-300 rounded-xl font-semibold min-h-[48px] flex items-center justify-center text-sm md:text-base border-2 border-green-600 shadow-sm">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                已選擇
              </span>
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[48px] flex items-center justify-center gap-2"
              >
                下一題
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={submitAllAnswers}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[48px] text-base md:text-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    提交中...
                  </>
                ) : (
                  <>
                    結束練習
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
