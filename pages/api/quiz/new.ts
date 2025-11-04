import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedQuestions } from '@/lib/questionLoader';
import { getRandomQuestions } from '@/lib/questionShuffler';
import { sessionStorage, QuizSessionData } from '@/lib/sessionStorage';

const MAX_QUESTION_COUNT = 100; // 限制每次最多请求的题目数
const DEFAULT_COUNT = 10;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许，仅支持 GET' });
  }

  try {
    // 获取选中的文件列表
    const filesParam = req.query.files as string | undefined;
    const selectedFiles = filesParam 
      ? filesParam.split(',').filter(f => f.trim().length > 0)
      : undefined;

    // 加载题目
    const { questions, errors } = getCachedQuestions('data', false, selectedFiles);

    // 获取查询参数（必须在加载题目后）
    const countParam = req.query.count as string | undefined;
    
    // 如果指定了count参数，使用指定的数量；否则返回所有题目
    const count = countParam 
      ? Math.min(Math.max(parseInt(countParam, 10) || DEFAULT_COUNT, 1), MAX_QUESTION_COUNT)
      : undefined; // undefined表示返回所有题目

    // 调试日志
    console.log('API请求参数:', {
      files: selectedFiles,
      countParam,
      count,
      totalQuestions: questions.length,
      useAllQuestions: !countParam
    });

    // 是否随机打散选项（默认 true）
    const shuffleChoices = req.query.shuffleChoices !== 'false';

    if (questions.length === 0) {
      return res.status(404).json({ 
        error: '没有可用的题目',
        details: errors.length > 0 ? '题库验证失败，请检查题库文件格式' : '题库为空',
      });
    }

    // 如果有验证错误，记录但继续处理
    if (errors.length > 0) {
      console.warn('题库验证警告:', JSON.stringify(errors, null, 2));
    }

    // 获取随机题目（不包含答案）
    const randomQuestions = getRandomQuestions(questions, count, shuffleChoices);
    
    console.log('生成的题目数量:', randomQuestions.length);

    if (randomQuestions.length === 0) {
      return res.status(404).json({ error: '无法生成题目' });
    }

    // 创建题目ID到解释的映射 - 直接从随机化后的题目获取解析
    const explanationsMap = new Map<number, string>();
    randomQuestions.forEach(rq => {
      explanationsMap.set(rq.id, rq.explanation);
      console.log(`题目 ${rq.id} 解析: ${rq.explanation.substring(0, 50)}...`);
    });

    // 创建session数据（存储在客户端）
    const sessionData = sessionStorage.createSession(randomQuestions, explanationsMap);

    // 返回完整的session数据给客户端
    res.status(200).json({
      sessionData,
      questions: randomQuestions.map(q => ({
        id: q.id,
        question: q.question,
        choices: q.choices,
      })),
      total: randomQuestions.length,
      count: randomQuestions.length,
    });
  } catch (error) {
    console.error('创建测验错误:', error);
    res.status(500).json({ 
      error: '创建测验失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
}

