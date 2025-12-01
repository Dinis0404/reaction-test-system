// 测试填空题解析功能
const { parseTxtQuestions } = require('./lib/txtParser');

// 测试填空题内容
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

console.log('开始测试填空题解析...');

try {
  const result = parseTxtQuestions(fillBlankContent, 'fill_blank_example.txt');
  
  console.log('解析结果:', {
    questions: result.questions.length,
    errors: result.errors.length
  });
  
  if (result.questions.length > 0) {
    console.log('\n解析出的题目详情:');
    result.questions.forEach((q, index) => {
      console.log(`\n第${index + 1}题:`);
      console.log('题目:', q.question);
      console.log('选项:', q.choices);
      console.log('正确答案索引:', q.answerIndex);
      console.log('解析:', q.explanation);
    });
  }
  
  if (result.errors.length > 0) {
    console.log('\n解析错误:', result.errors);
  }
  
} catch (error) {
  console.error('解析出错:', error);
}