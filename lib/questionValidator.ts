/**
 * 题目验证与标准化工具
 */

export interface Question {
  id: number;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation?: string;
}

export interface ValidatedQuestion extends Question {
  explanation: string;
}

/**
 * 验证题目是否包含必需的字段
 */
export function validateQuestion(question: any): question is ValidatedQuestion {
  if (!question || typeof question !== 'object') {
    return false;
  }

  // 检查必需字段
  if (typeof question.id !== 'number' || question.id < 0) {
    return false;
  }

  if (typeof question.question !== 'string' || question.question.trim().length === 0) {
    return false;
  }

  if (!Array.isArray(question.choices) || question.choices.length < 2) {
    return false;
  }

  // 验证所有选项都是字符串
  if (!question.choices.every((choice: any) => typeof choice === 'string' && choice.trim().length > 0)) {
    return false;
  }

  if (typeof question.answerIndex !== 'number') {
    return false;
  }

  // 验证 answerIndex 在有效范围内
  if (question.answerIndex < 0 || question.answerIndex >= question.choices.length) {
    return false;
  }

  return true;
}

/**
 * 标准化题目：确保所有字段都存在且格式正确
 */
export function normalizeQuestion(question: any): ValidatedQuestion | null {
  if (!validateQuestion(question)) {
    return null;
  }

  return {
    id: question.id,
    question: question.question.trim(),
    choices: question.choices.map((choice: string) => choice.trim()),
    answerIndex: question.answerIndex,
    explanation: typeof question.explanation === 'string' 
      ? question.explanation.trim() 
      : '暂无解释',
  };
}

/**
 * 验证并过滤题目数组
 */
export function validateQuestions(questions: any[]): {
  valid: ValidatedQuestion[];
  invalid: Array<{ question: any; reason: string }>;
} {
  const valid: ValidatedQuestion[] = [];
  const invalid: Array<{ question: any; reason: string }> = [];

  questions.forEach((q, index) => {
    if (!q || typeof q !== 'object') {
      invalid.push({ question: q, reason: '题目格式无效：不是对象' });
      return;
    }

    if (typeof q.id !== 'number' || q.id < 0) {
      invalid.push({ question: q, reason: `题目 ${index + 1}：id 必须是大于等于0的数字` });
      return;
    }

    if (typeof q.question !== 'string' || q.question.trim().length === 0) {
      invalid.push({ question: q, reason: `题目 ${index + 1}：question 必须是非空字符串` });
      return;
    }

    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      invalid.push({ question: q, reason: `题目 ${index + 1}：choices 必须是至少包含2个选项的数组` });
      return;
    }

    if (!q.choices.every((choice: any) => typeof choice === 'string' && choice.trim().length > 0)) {
      invalid.push({ question: q, reason: `题目 ${index + 1}：choices 中所有选项必须是非空字符串` });
      return;
    }

    if (typeof q.answerIndex !== 'number') {
      invalid.push({ question: q, reason: `题目 ${index + 1}：answerIndex 必须是数字` });
      return;
    }

    if (q.answerIndex < 0 || q.answerIndex >= q.choices.length) {
      invalid.push({ 
        question: q, 
        reason: `题目 ${index + 1}：answerIndex (${q.answerIndex}) 超出选项范围 [0-${q.choices.length - 1}]` 
      });
      return;
    }

    const normalized = normalizeQuestion(q);
    if (normalized) {
      valid.push(normalized);
    }
  });

  return { valid, invalid };
}




