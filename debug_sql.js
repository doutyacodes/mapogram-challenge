const fs = require('fs');
const sql = fs.readFileSync('wowfy2.sql', 'utf8');
const start = sql.indexOf('INSERT INTO `challenges`');
if (start !== -1) {
  const end = sql.indexOf(';', start);
  const sql_seg = sql.substring(start, end);
  const rows = sql_seg.match(/\([^)]+\)/g);
  console.log('Main columns row count: 1? (the col names)');
  console.log('Total parenthetical blocks:', (rows ? rows.length : 0));
  if (rows) {
    rows.slice(1).forEach(r => {
      const parts = r.split(',');
      console.log('Challenge: ' + parts[2]); // title
    });
  }
} else {
  console.log('INSERT INTO challenges not found');
}
