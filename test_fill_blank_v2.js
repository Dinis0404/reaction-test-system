const http = require('http');

// 测试填空题API - 使用端口3001
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/quiz/new?files=other/fill_blank_example.txt',
  method: 'GET'
};

console.log('正在测试填空题API (端口3001)...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('API响应状态码:', res.statusCode);
    
    try {
      const result = JSON.parse(data);
      
      if (result.error) {
        console.log('❌ API错误:', result.error);
        if (result.details) {
          console.log('详细信息:', result.details);
        }
      } else {
        console.log('✅ API调用成功');
        console.log('题目总数:', result.total);
        
        if (result.questions && result.questions.length > 0) {
          console.log('\n解析出的题目:');
          result.questions.forEach((q, i) => {
            console.log(`\n题目 ${i + 1}:`);
            console.log('  题目:', q.question);
            console.log('  类型:', q.type || '未知');
            console.log('  选项数量:', q.choices ? q.choices.length : 0);
            if (q.choices && q.choices.length > 0) {
              console.log('  选项:', q.choices);
            }
          });
        } else {
          console.log('❌ 没有解析出题目');
        }
      }
    } catch (error) {
      console.log('❌ JSON解析错误:', error.message);
      console.log('原始响应:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.log('❌ 请求错误:', error.message);
  console.log('请检查服务器是否在端口3001上运行');
});

req.end();