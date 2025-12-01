# API 文档

## 概述

本测验系统提供三个主要 API 端点，用于创建测验、提交答案和获取结果。

## API 端点

### 1. GET /api/quiz/new

创建新的测验 session 并获取随机题目。

**查询参数：**
- `count` (可选, number): 题目数量，默认为 10，最大为 100
- `shuffleChoices` (可选, boolean): 是否随机打散选项，默认为 true

**响应示例：**
```json
{
  "sessionId": "quiz_1234567890_abc123",
  "questions": [
    {
      "id": 1,
      "question": "题目内容",
      "choices": ["选项A", "选项B", "选项C", "选项D"]
    }
  ],
  "total": 10,
  "count": 10
}
```

**状态码：**
- `200`: 成功
- `404`: 没有可用题目
- `500`: 服务器错误

---

### 2. POST /api/quiz/[sessionId]/answer

提交答案（支持单题或批量提交）。

**路径参数：**
- `sessionId`: 测验 session ID

**请求体示例（单题）：**
```json
{
  "answers": {
    "questionId": 1,
    "selectedIndex": 0
  }
}
```

**请求体示例（批量）：**
```json
{
  "answers": [
    {
      "questionId": 1,
      "selectedIndex": 0
    },
    {
      "questionId": 2,
      "selectedIndex": 2
    }
  ]
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "答案已保存",
  "submittedCount": 2
}
```

**状态码：**
- `200`: 成功
- `400`: 请求格式错误或 session 已提交
- `404`: Session 不存在或已过期
- `500`: 服务器错误

---

### 3. GET /api/quiz/[sessionId]/result

获取测验结果。

**路径参数：**
- `sessionId`: 测验 session ID

**响应示例：**
```json
{
  "sessionId": "quiz_1234567890_abc123",
  "score": 80,
  "correctCount": 8,
  "totalQuestions": 10,
  "submitted": true,
  "submittedAt": 1234567890000,
  "results": [
    {
      "questionId": 1,
      "question": "题目内容",
      "choices": ["选项A", "选项B", "选项C", "选项D"],
      "selectedIndex": 0,
      "correctIndex": 0,
      "isCorrect": true,
      "explanation": "答案解析"
    }
  ]
}
```

**状态码：**
- `200`: 成功
- `404`: Session 不存在或已过期
- `500`: 服务器错误

---

## 数据验证规则

### 题目格式要求

题库文件必须为 JSON 格式，放在 `data/` 目录下。每个题目必须包含以下字段：

```json
{
  "id": 1,                           // number, 必需, >= 0
  "question": "题目内容",            // string, 必需, 非空
  "choices": ["选项A", "选项B"],     // string[], 必需, 至少2个选项
  "answerIndex": 0,                  // number, 必需, 0 <= answerIndex < choices.length
  "explanation": "答案解析"          // string, 可选
}
```

### 验证错误处理

- 无效的题目会被跳过并记录错误日志
- 验证错误不会阻止有效题目的加载
- 如果所有题目都无效，API 会返回 404 错误

---

## 安全特性

1. **题目数量限制**: 每次请求最多 100 题
2. **Session 过期**: Session 在 30 分钟后自动过期
3. **输入验证**: 所有输入都经过严格验证
4. **答案保护**: 题目返回时不包含答案信息
5. **提交锁定**: 已提交的 session 无法修改答案

---

## 使用流程示例

```javascript
// 1. 创建新测验
const newQuiz = await fetch('/api/quiz/new?count=10');
const { sessionId, questions } = await newQuiz.json();

// 2. 提交答案（可以逐题提交或批量提交）
await fetch(`/api/quiz/${sessionId}/answer`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answers: [
      { questionId: 1, selectedIndex: 0 },
      { questionId: 2, selectedIndex: 1 }
    ]
  })
});

// 3. 获取结果
const result = await fetch(`/api/quiz/${sessionId}/result`);
const data = await result.json();
console.log(`得分: ${data.score}%`);
```

---

## 注意事项

1. Session ID 在创建后 30 分钟内有效
2. 一旦调用 `/result` 端点，session 会被标记为已提交
3. 选项顺序会随机打散（除非 `shuffleChoices=false`）
4. 题目顺序也会随机打散
5. 题库文件支持多文件，所有 `.json` 文件都会被加载




