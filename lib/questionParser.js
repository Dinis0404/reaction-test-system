export function parseQuestionFile(content, fileName) {
  const lines = content.split('\n').filter(line => line.trim());
  const questions = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^\d+\./)) {
      if (current) questions.push(current);
      current = { id: Date.now() + i, question: line.replace(/^\d+\.\s*/, ''), choices: [], correctIndex: null, explanation: '', type: 'multiple_choice' };
    } else if (line.startsWith('A.') || line.startsWith('B.') || line.startsWith('C.') || line.startsWith('D.')) {
      if (current) {
        const choiceText = line.substring(2).trim();
        current.choices.push(choiceText.includes('*') ? choiceText.replace('*', '').trim() : choiceText);
        if (choiceText.includes('*')) current.correctIndex = current.choices.length - 1;
      }
    } else if (line.startsWith('答案：')) {
      if (current) {
        const m = line.match(/答案：\s*([A-D])/i);
        if (m) current.correctIndex = 'ABCD'.indexOf(m[1].toUpperCase());
      }
    } else if (line.startsWith('解析：')) {
      if (current) current.explanation = line.substring(3).trim();
    } else if (line.includes('_____') || (line.includes('_') && line.includes('='))) {
      if (current) {
        const match = line.match(/^(.+)\s*=\s*(.+)$/);
        if (match) {
          current.question = match[1].trim();
          current.answer = match[2].trim();
          current.type = 'fill_blank';
          current.choices = [];
        }
      }
    } else if (current && current.question) {
      current.question += ' ' + line;
    }
  }
  if (current) questions.push(current);
  return questions.filter(q => q.question && (q.type === 'multiple_choice' ? q.choices.length >= 2 : true));
}

