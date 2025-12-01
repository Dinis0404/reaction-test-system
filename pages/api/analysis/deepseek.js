export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const { summary, results, manualScores, term, classGroup, grade, apiKey: apiKeyBody } = req.body || {};
    const apiKey = process.env.DEEPSEEK_API_KEY || req.headers['x-deepseek-key'] || apiKeyBody;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing DeepSeek API key' });
    }
    let prompt;
    if (Array.isArray(manualScores) && manualScores.length > 0) {
      const ctx = `學生背景：澳門高中${grade || '一年級（高一）'}；班級：${classGroup || '未分類'}；學段：${term ? `第${term}學段` : '未指定'}`;
      prompt = [
        ctx,
        '請基於以下科目分數與備註，提供貼近澳門高中課程的重點分析：',
        '1) 整體表現與分數分佈（指出強項與弱項）',
        '2) 各科短板與可能原因（結合本地教學與常見難點）',
        '3) 未來兩週的具體提升策略（每日/每科可操作清單）',
        '4) 建議的練習題型與資源（可包含校內考試側重）',
        JSON.stringify(manualScores),
      ].join('\n');
    } else {
      prompt = [
        '學生背景：澳門高中一年級（高一）。請基於以下測驗結果做重點分析：',
        '1) 整體表現與正確率',
        '2) 分類與題型的弱項',
        '3) 改善方向（具體到題型或知識點）',
        '4) 下次練習策略（3點）',
        '摘要：',
        JSON.stringify(summary || {}),
        '詳情：',
        JSON.stringify((results || []).slice(0, 100)),
      ].join('\n');
    }
    const body = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是面向澳門高中一年級學生的學業分析顧問。用繁體中文回答，不使用 Markdown 標記。每條建議以「• 」開頭，重點精簡可操作。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    };
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(502).json({ error: 'DeepSeek API error', message: text });
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ analysis: content });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to analyze', message: error?.message || 'unknown' });
  }
}
