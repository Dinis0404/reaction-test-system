# 在线测验系统

一个基于 Next.js 的在线测验系统，可以从资料夹读取题目文件，随机排列题目并提供选择题界面让用户作答，显示分数与回馈。

## 功能特点

- 📚 从 `/data` 资料夹读取 JSON 格式的题目
- 🎲 自动随机排列题目顺序
- 💡 美观的答题界面
- ✅ 即时显示答题结果与详细回馈
- 📊 分数统计与进度显示
- 🎨 使用 Tailwind CSS 构建现代化 UI

## 安装步骤

1. **安装依赖**
```bash
npm install
```

2. **准备题库文件**
   将题目文件放在 `data/` 目录下，格式为 JSON。示例格式：

```json
[
  {
    "id": 1,
    "question": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correctAnswer": 0,
    "explanation": "答案解析"
  }
]
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问网站**
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 题库文件格式

题库文件必须为 JSON 格式，放在 `data/` 目录下。系统会自动加载该目录下所有 `.json` 文件。

每个题目必须包含以下字段：

- `id` (number): 题目唯一标识符，必须 >= 0
- `question` (string): 题目内容，必须非空
- `choices` (string[]): 选项数组，至少 2 个选项，每个选项必须非空
- `answerIndex` (number): 正确答案的索引（0 为第一个选项），必须在 choices 范围内
- `explanation` (string, 可选): 答案解析

**示例：**
```json
{
  "id": 1,
  "question": "JavaScript 中哪个方法用于向数组末尾添加元素？",
  "choices": ["push()", "pop()", "shift()", "unshift()"],
  "answerIndex": 0,
  "explanation": "push() 方法用于向数组末尾添加一个或多个元素。"
}
```

**验证规则：**
- 不符合格式要求的题目会被跳过并记录错误日志
- 验证错误不会阻止有效题目的加载

## 项目结构

```
website/
├── data/                  # 题库资料夹
│   └── questions.json     # 题目文件
├── pages/
│   ├── api/              # API 路由
│   │   └── quiz/         # 测验 API
│   │       ├── new.ts                           # 创建新测验
│   │       └── [sessionId]/                     # Session 相关
│   │           ├── answer.ts                    # 提交答案
│   │           └── result.ts                    # 获取结果
│   ├── _app.tsx          # Next.js App 组件
│   └── index.tsx         # 首页
├── lib/                   # 工具库
│   ├── questionValidator.ts    # 题目验证
│   ├── questionLoader.ts       # 题库加载
│   ├── questionShuffler.ts     # 题目随机化
│   └── sessionManager.ts       # Session 管理
├── components/
│   ├── QuizContainer.tsx # 测验容器组件
│   └── QuestionCard.tsx  # 题目卡片组件
├── app/
│   └── globals.css       # 全局样式
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## API 接口

### GET /api/quiz/new
创建新的测验 session 并获取随机题目

**查询参数：**
- `count` (可选): 题目数量，默认为 10，最大为 100
- `shuffleChoices` (可选): 是否随机打散选项，默认为 true

**响应：**
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

### POST /api/quiz/[sessionId]/answer
提交答案（支持单题或批量提交）

**请求体示例（批量）：**
```json
{
  "answers": [
    {
      "questionId": 1,
      "selectedIndex": 0
    }
  ]
}
```

**响应：**
```json
{
  "success": true,
  "message": "答案已保存",
  "submittedCount": 1
}
```

### GET /api/quiz/[sessionId]/result
获取测验结果

**响应：**
```json
{
  "sessionId": "quiz_1234567890_abc123",
  "score": 80,
  "correctCount": 8,
  "totalQuestions": 10,
  "submitted": true,
  "submittedAt": 1234567890000,
  "results": [...]
}
```

详细 API 文档请参阅 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 构建生产版本

```bash
npm run build
npm start
```

## 技术栈

- **前端框架**: Next.js 14 (React 18)
- **样式**: Tailwind CSS
- **语言**: TypeScript
- **后端**: Next.js API Routes
- **状态管理**: 内存 Map（Session 管理）
- **随机算法**: Fisher-Yates 洗牌算法

## 核心功能

✅ **题目验证**: 自动验证题库格式，跳过无效题目  
✅ **随机化**: 题目和选项都会随机打散  
✅ **Session 管理**: 支持多个并发的测验 session  
✅ **答案保护**: 题目返回时不包含答案信息  
✅ **输入验证**: 严格的输入验证和错误处理  
✅ **性能优化**: 题目缓存机制，减少文件读取

## 注意事項

- 确保 `data/questions.json` 文件存在
- 题目文件必须是有效的 JSON 格式
- 服务器端口默认为 3000（可在 `package.json` 中修改）

## 许可证

MIT

## 成績分析功能規劃

### 目標
- 在網站新增「成績分析」頁面與資料管道，將每次練習的成績與詳情保存並可視化，提供趨勢、分類、弱項分析與匯出功能。

### 資料來源與保存
- 成績來源：`/api/quiz/complete` 回傳的 `summary` 與 `results`。
- 前端保存：使用 `localStorage`（鍵名：`quiz_results`）記錄每次練習的摘要與詳情，避免無伺服器環境寫檔限制。
- 匯出/匯入：提供 JSON 匯出與匯入，支援跨裝置轉移資料。

### 資料結構（建議）
```json
{
  "id": "result_1733020000000_abcd123",
  "sessionId": "quiz_...",
  "timestamp": 1733020000000,
  "score": 80,
  "correctCount": 8,
  "totalQuestions": 10,
  "selectedFiles": ["english/U2LP_MC.txt", "chinese/登高.txt"],
  "folder": "english",
  "results": [
    {
      "questionId": 1,
      "isCorrect": true,
      "correctIndex": 2,
      "selectedIndex": 2
    }
  ]
}
```

### 分析維度
- 整體：平均分數、總作答次數、近 N 次趨勢。
- 依分類：`english`、`math`、`chinese`、`other` 的平均分與正確率。
- 題型：選擇題/填空題正確率。
- 錯題 TOP：錯誤次數最高的題目與選項分佈。
- 時間維度：按日期的分數折線圖、時段熱度（早/晚）。

### 前端頁面與元件
- 新頁面：`pages/report.tsx`
  - `ReportDashboard`：總覽指標卡片（平均分數、練習次數、最近分數）。
  - `TrendChart`：近 N 次分數折線（初期不引入圖表庫，使用原生 SVG/簡單條形）。
  - `CategoryBreakdown`：分類正確率條形圖。
  - `WrongQuestionList`：錯題清單與頻率。
  - `ExportImportControls`：JSON 匯出/匯入。
- 導航：在首頁或結果頁加入「查看成績分析」按鈕，跳轉至 `/report`。

### 邏輯與函式庫
- 新增工具：`lib/analytics.ts`
  - `saveResult(summary, results, context)`：保存一次練習的紀錄至 `localStorage`。
  - `getAllResults()`：讀取全部紀錄。
  - `computeOverview(results)`：計算平均分、次數、最近分數。
  - `computeByCategory(results)`：計算各分類指標。
  - `computeTrend(results)`：近 N 次分數序列。
  - `computeWrongTop(results)`：統計錯題排名與選項分佈。
- 介面對接：在 `QuizContainer.submitAllAnswers` 成功後寫入 `saveResult(...)`。

### API（選配）
- 若需伺服器端保存與同步，可後續擴充：
  - `POST /api/report/ingest`：接收一次練習的摘要與詳情（注意無伺服器環境文件寫入限制）。
  - `GET /api/report/list`：返回歷史成績（初版採前端本地保存，不強制後端）。

### 實作步驟
1. 建立 `lib/analytics.ts`，實作本地保存與統計函式。
2. 在 `components/QuizContainer.tsx` 的提交結果成功處理中呼叫 `saveResult(...)`。
3. 新增 `pages/report.tsx` 與對應展示元件。
4. 在結果頁加入「查看成績分析」入口；首頁導覽可選。
5. 加入 JSON 匯出/匯入邏輯與防呆（資料版本欄位）。
6. 驗證：製造 3–5 次練習資料，檢查趨勢與分類統計是否正確。

### 後續擴充
- 標籤與主題：為每個檔案或題目標記事項（章節/講次），增加細粒度分析。
- 雲端同步：接入資料庫（如 Supabase）以支援跨裝置記錄與分享。
- 視覺化強化：引入圖表庫（如 Chart.js、Recharts）改善圖表表現。

### DeepSeek 接入
- 新增 API：`POST /api/analysis/deepseek`，將一次練習的摘要與詳情送至 DeepSeek 取得分析。
- 環境變數：在專案根建立 `.env.local`，加入 `DEEPSEEK_API_KEY=你的密鑰`。
- 使用方式：完成練習後在結果頁點擊「AI 分析成績」，顯示分析文字。
