const fs = require('fs');
const sql = fs.readFileSync('challenges_data.sql', 'utf8');
const tables = ['tasks', 'questions', 'answers', 'task_map', 'task_media', 'task_pedometer', 'task_relations'];
tables.forEach(t => {
  const marker = 'INSERT INTO `' + t + '`';
  const start = sql.indexOf(marker);
  if (start !== -1) {
    const end = sql.indexOf(';', start);
    const sql_seg = sql.substring(start, end);
    const rows = sql_seg.match(/\([^)]+\)/g);
    console.log('-> ' + t + ': ' + (rows ? rows.length - 1 : 0) + ' rows');
  } else {
    console.log('-> ' + t + ': not found');
  }
});
