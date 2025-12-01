/**
 * Session 状态管理
 */
import { ValidatedQuestion } from './questionValidator';
import { ShuffledQuestion } from './questionShuffler';

export interface QuizAnswer {
  questionId: number;
  selectedIndex: number;
  timestamp?: number;
}

export interface QuizSession {
  sessionId: string;
  questions: ShuffledQuestion[];
  answers: Map<number, QuizAnswer>; // questionId -> answer
  explanations: Map<number, string>; // questionId -> explanation
  createdAt: number;
  submitted: boolean;
  submittedAt?: number;
}

class SessionManager {
  private sessions: Map<string, QuizSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟过期

  /**
   * 创建新的 session
   */
  createSession(questions: ShuffledQuestion[], explanations?: Map<number, string>): string {
    const sessionId = this.generateSessionId();
    const session: QuizSession = {
      sessionId,
      questions: [...questions],
      answers: new Map(),
      explanations: explanations || new Map(),
      createdAt: Date.now(),
      submitted: false,
    };
    
    this.sessions.set(sessionId, session);
    console.log(`创建 Session ${sessionId}，题目数量: ${questions.length}`);
    return sessionId;
  }

  /**
   * 获取 session
   */
  getSession(sessionId: string): QuizSession | null {
    console.log(`尝试获取 Session ${sessionId}`);
    console.log(`当前存储的 Session 数量: ${this.sessions.size}`);
    
    // 打印所有session ID用于调试
    if (this.sessions.size > 0) {
      console.log('当前存储的 Session IDs:', Array.from(this.sessions.keys()));
    }
    
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      console.log(`Session ${sessionId} 不存在`);
      return null;
    }

    // 检查是否过期
    if (Date.now() - session.createdAt > this.SESSION_TIMEOUT) {
      console.log(`Session ${sessionId} 已过期`);
      this.sessions.delete(sessionId);
      return null;
    }

    console.log(`获取 Session ${sessionId} 成功，题目数量: ${session.questions.length}`);
    return session;
  }

  /**
   * 提交答案
   */
  submitAnswer(sessionId: string, answer: QuizAnswer): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }

    if (session.submitted) {
      return false; // 已提交，不能再修改
    }

    session.answers.set(answer.questionId, {
      ...answer,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 批量提交答案
   */
  submitAnswers(sessionId: string, answers: QuizAnswer[]): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }

    if (session.submitted) {
      return false;
    }

    answers.forEach(answer => {
      session.answers.set(answer.questionId, {
        ...answer,
        timestamp: Date.now(),
      });
    });

    return true;
  }

  /**
   * 标记 session 为已提交
   */
  markAsSubmitted(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }

    session.submitted = true;
    session.submittedAt = Date.now();
    
    return true;
  }

  /**
   * 获取 session 结果
   */
  getSessionResult(sessionId: string): {
    session: QuizSession;
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
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    let correctCount = 0;
    const results = session.questions.map(q => {
      const answer = session.answers.get(q.id);
      const selectedIndex = answer?.selectedIndex ?? null;
      
      // 使用随机化后的正确答案索引进行比较
      const isCorrect = selectedIndex === q.shuffledAnswerIndex;
      
      if (isCorrect) {
        correctCount++;
      }

      return {
        questionId: q.id,
        question: q.question,
        choices: q.choices,
        selectedIndex,
        correctIndex: q.shuffledAnswerIndex,
        isCorrect,
        explanation: session.explanations.get(q.id) || '暂无解释',
      };
    });

    const totalQuestions = session.questions.length;
    const score = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * 100) 
      : 0;

    return {
      session,
      score,
      correctCount,
      totalQuestions,
      results,
    };
  }

  /**
   * 删除 session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 清理过期 session
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    this.sessions.forEach((session, sessionId) => {
      if (now - session.createdAt > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * 生成唯一的 session ID
   */
  private generateSessionId(): string {
    return `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// 全局单例模式 - 确保在服务器环境中session共享
let globalSessionManager: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!globalSessionManager) {
    globalSessionManager = new SessionManager();
    
    // 只在服务器环境中设置定时清理
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        const cleaned = globalSessionManager!.cleanup();
        if (cleaned > 0) {
          console.log(`清理了 ${cleaned} 个过期的 session`);
        }
      }, 10 * 60 * 1000);
    }
  }
  return globalSessionManager;
}

// 导出单例实例
export const sessionManager = getSessionManager();

