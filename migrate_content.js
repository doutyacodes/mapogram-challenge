const mysql = require('mysql2/promise');

async function migrate() {
  const db = await mysql.createConnection({
    host: '68.178.163.247',
    user: 'devuser_mapogram_challenges',
    database: 'devuser_mapogram_challenges',
    password: 'devuser_mapogram_challenges',
    port: '3306'
  });

  try {
    console.log("-> Patching Migration Script...");

    // 1. Determine Quiz Task ID for New Challenge (10002)
    const [tasks] = await db.execute("SELECT id FROM tasks WHERE challenge_id = 10002 AND task_type = 'quiz' LIMIT 1");
    let quizTaskId = tasks.length > 0 ? tasks[0].id : 10005;

    // 2. Questions Migration (No challenge_id column in mapogram schema)
    const questions = [
      { id: 2, type: 'text', timer: 30, text: 'Question 1 (ans a)' },
      { id: 3, type: 'image', timer: 30, text: 'Question (ans a)', url: 'https://wowfy.in/wowfy_app_codebase/photos/file_67c1b688973008.33262408.jpeg' },
      { id: 4, type: 'video', timer: 30, text: 'Question (ans a)', url: 'https://wowfy.in/wowfy_app_codebase/videos/file_67c1b68f1dbef3.68568172.mp4' }
    ];

    for (const q of questions) {
        await db.execute(`
            INSERT IGNORE INTO questions (id, task_id, question_text, question_type, media_url, timer_seconds)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [q.id, quizTaskId, q.text, q.type, q.url || null, q.timer]);
    }

    // 3. Answers Migration
    await db.execute(`
        INSERT IGNORE INTO answers (id, question_id, answer_text, is_correct) VALUES
        (5, 2, 'a', 1), (6, 2, 'b', 0), (7, 2, 'c', 0), (8, 2, 'd', 0),
        (9, 3, 'a', 1), (10, 3, 'b', 0), (11, 3, 'c', 0), (12, 3, 'd', 0),
        (13, 4, 'a', 1), (14, 4, 'b', 0), (15, 4, 'c', 0), (16, 4, 'd', 0)
    `);

    // 4. Update Radii
    await db.execute("UPDATE challenges SET radius_meters = 20 WHERE radius_meters IS NULL");

    console.log("-> Content Migration Complete.");

  } catch (err) {
    console.error("Migration Error:", err);
  } finally {
    await db.end();
  }
}

migrate();
