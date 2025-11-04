/**
 * 题目与选项随机化工具
 */
import { ValidatedQuestion } from './questionValidator';

export interface ShuffledQuestion {
  id: number;
  question: string;
  choices: string[];
  originalAnswerIndex: number; // 原始正确答案索引
  shuffledAnswerIndex: number;  // 随机化后的正确答案索引
  explanation: string;         // 题目解析
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 随机打散题目数组
 */
export function shuffleQuestions(questions: ValidatedQuestion[]): ValidatedQuestion[] {
  return shuffleArray([...questions]);
}

/**
 * 随机打散单个题目的选项，并更新正确答案索引
 */
export function shuffleQuestionChoices(question: ValidatedQuestion): ShuffledQuestion {
  const originalChoices = [...question.choices];
  const originalAnswerIndex = question.answerIndex;
  
  // 创建索引映射：[原始索引] -> 随机化后的索引
  const indices = originalChoices.map((_, i) => i);
  const shuffledIndices = shuffleArray(indices);
  
  // 打散选项
  const shuffledChoices = shuffledIndices.map(idx => originalChoices[idx]);
  
  // 找到原始正确答案在随机化后的新位置
  const shuffledAnswerIndex = shuffledIndices.indexOf(originalAnswerIndex);
  
  return {
    id: question.id,
    question: question.question,
    choices: shuffledChoices,
    originalAnswerIndex,
    shuffledAnswerIndex,
    explanation: question.explanation || '暂无解析',
  };
}

/**
 * 随机打散题目数组并限制数量
 */
export function getRandomQuestions(
  questions: ValidatedQuestion[],
  count?: number,
  shuffleChoices: boolean = true
): ShuffledQuestion[] {
  if (questions.length === 0) {
    return [];
  }

  // 打散题目
  const shuffledQuestions = shuffleQuestions(questions);
  
  // 限制数量：如果count为undefined，返回所有题目
  const selectedQuestions = count !== undefined 
    ? shuffledQuestions.slice(0, Math.min(count, shuffledQuestions.length))
    : shuffledQuestions;

  // 随机打散选项
  return selectedQuestions.map(q => 
    shuffleChoices ? shuffleQuestionChoices(q) : {
      id: q.id,
      question: q.question,
      choices: q.choices,
      originalAnswerIndex: q.answerIndex,
      shuffledAnswerIndex: q.answerIndex,
      explanation: q.explanation || '暂无解析',
    }
  );
}




