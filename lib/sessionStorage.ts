/**
 * Session 存储管理类 - 兼容Vercel的无服务器环境
 * 使用客户端存储 + 服务器端验证的方案
 * 在Vercel中，每次API调用都是独立的，无法共享内存数据
 * 解决方案：将session数据存储在客户端，服务器只做验证和计算
 */
import { ShuffledQuestion } from './questionShuffler';

export interface QuizAnswer {
  questionId: number;
  selectedIndex: number;
<<<<<<< HEAD
  userInput?: string; // 用于存储填空题用户输入的内容
=======
>>>>>>> 79fe0b00784f73255711c3a8084566819cf8a950
  timestamp?: number;
}

export interface QuizSessionData {
  sessionId: string;
  questions: ShuffledQuestion[];
  answers: QuizAnswer[];
  explanations: Record<number, string>;
  createdAt: number;
  submitted: boolean;
  submittedAt?: number;
}

class SessionStorage {
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟过期

  /**
   * 创建新的 session
   */
  createSession(questions: ShuffledQuestion[], explanations?: Map<number, string>): QuizSessionData {
    const sessionId = this.generateSessionId();
    
    const session: QuizSessionData = {
      sessionId,
      questions: [...questions],
      answers: [],
      explanations: explanations ? Object.fromEntries(explanations) : {},
      createdAt: Date.now(),
      submitted: false,
    };

    console.log(`创建 Session ${sessionId}，题目数量: ${questions.length}`);
    
    return session;
  }

  /**
   * 验证 session 数据
   */
  validateSession(sessionData: QuizSessionData): boolean {
    if (!sessionData) {
      console.error('Session 数据为空');
      return false;
    }

    // 检查session是否过期
    if (Date.now() - sessionData.createdAt > this.SESSION_TIMEOUT) {
      console.error(`Session ${sessionData.sessionId} 已过期`);
      return false;
    }

    // 检查基本数据结构
    if (!sessionData.sessionId || !sessionData.questions || !Array.isArray(sessionData.questions)) {
      console.error('Session 数据结构不完整');
      return false;
    }

    console.log(`验证 Session ${sessionData.sessionId} 成功`);
    return true;
  }

  /**
   * 提交答案
   */
  submitAnswer(sessionData: QuizSessionData, answer: QuizAnswer): QuizSessionData {
    if (!this.validateSession(sessionData)) {
      throw new Error('Session 验证失败');
    }

    if (sessionData.submitted) {
      throw new Error('Session 已提交，无法修改答案');
    }

    // 更新答案
    const existingAnswerIndex = sessionData.answers.findIndex(a => a.questionId === answer.questionId);
    
    if (existingAnswerIndex >= 0) {
      // 更新现有答案
      sessionData.answers[existingAnswerIndex] = {
        ...answer,
        timestamp: Date.now(),
      };
    } else {
      // 添加新答案
      sessionData.answers.push({
        ...answer,
        timestamp: Date.now(),
      });
    }

    console.log(`Session ${sessionData.sessionId} 提交答案成功，题目ID: ${answer.questionId}`);
    return sessionData;
  }

  /**
   * 批量提交答案
   */
  submitAnswers(sessionData: QuizSessionData, answers: QuizAnswer[]): QuizSessionData {
    if (!this.validateSession(sessionData)) {
      throw new Error('Session 验证失败');
    }

    if (sessionData.submitted) {
      throw new Error('Session 已提交，无法修改答案');
    }

    answers.forEach(answer => {
      const existingAnswerIndex = sessionData.answers.findIndex(a => a.questionId === answer.questionId);
      
      if (existingAnswerIndex >= 0) {
        sessionData.answers[existingAnswerIndex] = {
          ...answer,
          timestamp: Date.now(),
        };
      } else {
        sessionData.answers.push({
          ...answer,
          timestamp: Date.now(),
        });
      }
    });

    console.log(`Session ${sessionData.sessionId} 批量提交答案成功，数量: ${answers.length}`);
    return sessionData;
  }

  /**
   * 标记 session 为已提交
   */
  markAsSubmitted(sessionData: QuizSessionData): QuizSessionData {
    if (!this.validateSession(sessionData)) {
      throw new Error('Session 验证失败');
    }

    sessionData.submitted = true;
    sessionData.submittedAt = Date.now();
    
    console.log(`Session ${sessionData.sessionId} 已标记为已提交`);
    return sessionData;
  }

  /**
   * 获取 session 结果
   */
  getSessionResult(sessionData: QuizSessionData): {
    session: QuizSessionData;
    score: number;
    correctCount: number;
    totalQuestions: number;
    results: Array<{
      questionId: number;
      question: string;
      choices: string[];
      selectedIndex: number | null;
      correctIndex: number;
      isCorrect: boolean;
      explanation: string;
    }>;
  } | null {
    if (!this.validateSession(sessionData)) {
      return null;
    }

    let correctCount = 0;
    const results = sessionData.questions.map(q => {
      const answer = sessionData.answers.find(a => a.questionId === q.id);
      const selectedIndex = answer?.selectedIndex ?? null;
      
<<<<<<< HEAD
      // 检查是否是填空题
      const isFillBlank = q.question.includes('____');
      
      let isCorrect;
      
      if (isFillBlank) {
        // 填空题的特殊逻辑：需要比较用户输入的内容与正确答案
        if (answer?.userInput) {
          // 使用用户输入的内容与正确答案进行比较
          const userInput = answer.userInput;
          const correctAnswer = q.choices[q.shuffledAnswerIndex]; // 正确答案
          
          // 简化的比较：去除空格和大小写差异
          const normalizedUserInput = userInput.trim().toLowerCase();
          const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
          
          isCorrect = normalizedUserInput === normalizedCorrectAnswer;
          
          console.log(`填空题结果检查 - 题目 ${q.id}: 用户输入="${userInput}", 正确答案="${correctAnswer}", 是否匹配=${isCorrect}`);
        } else {
          // 用户没有输入答案
          isCorrect = false;
          console.log(`填空题结果检查 - 题目 ${q.id}: 没有用户输入，判断为错误`);
        }
      } else {
        // 选择题的正常逻辑
        isCorrect = selectedIndex !== null && selectedIndex === q.shuffledAnswerIndex;
      }
=======
      // 正确判断逻辑：
      // 1. 如果用户没有选择答案（selectedIndex为null），视为错误
      // 2. 如果用户选择了答案，判断是否正确
      const isCorrect = selectedIndex !== null && selectedIndex === q.shuffledAnswerIndex;
>>>>>>> 79fe0b00784f73255711c3a8084566819cf8a950
      
      if (isCorrect) {
        correctCount++;
      }

      // 调试日志：检查每个题目的判断结果
      console.log(`题目 ${q.id}: 选择=${selectedIndex}, 正确答案=${q.shuffledAnswerIndex}, 是否正确=${isCorrect}`);

      // 优先从题目对象本身获取解析，如果不存在再从sessionData.explanations中获取
      const explanation = q.explanation || 
                        (sessionData.explanations && sessionData.explanations[q.id]) || 
                        '暂无解释';

      return {
        questionId: q.id,
        question: q.question,
        choices: q.choices,
        selectedIndex,
        correctIndex: q.shuffledAnswerIndex,
        isCorrect,
        explanation,
      };
    });

    // 调试日志：检查总分计算
    console.log(`总分计算: 正确数=${correctCount}, 总题数=${sessionData.questions.length}, 得分=${Math.round((correctCount / sessionData.questions.length) * 100)}`);

    const totalQuestions = sessionData.questions.length;
    const score = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * 100) 
      : 0;

    return {
      session: sessionData,
      score,
      correctCount,
      totalQuestions,
      results,
    };
  }

  /**
   * 生成唯一的 session ID
   */
  private generateSessionId(): string {
    return `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// 单例模式
export const sessionStorage = new SessionStorage();