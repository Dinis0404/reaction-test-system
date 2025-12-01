const { parseTxtQuestions } = require('./lib/txtParser');
const { validateQuestions } = require('./lib/questionValidator');

// 测试填空题格式
const fillBlankContent = `這是填空題示例

1. 水在攝氏____度時結冰
答案：0

2. 中國的首都是____
答案：北京

3. ____是最大的海洋
答案：太平洋

4. 太陽系有____顆行星
答案：8

5. 氧氣的化學符號是____
答案：O`;

console.log('=== 测试填空题解析 ===');
const result = parseTxtQuestions(fillBlankContent, 'test.txt');
console.log('解析结果:', result);

console.log('\n=== 测试填空题验证 ===');
const validationResult = validateQuestions(result.questions);
console.log('验证结果:', validationResult);

console.log('\n=== 解析出的填空题 ===');
result.questions.forEach((q, index) => {
  console.log(`题目 ${index + 1}:`, q.question);
  console.log(`选项:`, q.choices);
  console.log(`答案索引:`, q.answerIndex);
  console.log(`正确答案:`, q.choices[q.answerIndex]);
  console.log('---');
});

console.log('\n=== 错误信息 ===');
if (result.errors.length > 0) {
  result.errors.forEach(err => console.log(err));
} else {
  console.log('没有错误');
}