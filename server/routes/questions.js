const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/questions/quiz?count=10
// Returns `count` unanswered questions for Neev (user_id=1, grade=5), fully random.
router.get('/quiz', (req, res) => {
  const count = Math.min(parseInt(req.query.count, 10) || 10, 50);
  const userId = 1;
  const grade  = 5;

  try {
    const questions = db.prepare(`
      SELECT q.id, s.name AS subject, s.id AS subject_id, t.name AS topic, t.id AS topic_id,
             q.question, q.answer, q.wrong_a, q.wrong_b, q.wrong_c, q.explanation
      FROM questions q
      JOIN topics   t ON t.id = q.topic_id
      JOIN subjects s ON s.id = t.subject_id
      WHERE q.grade = ? AND q.active = 1 AND q.wrong_a IS NOT NULL
        AND q.id NOT IN (SELECT question_id FROM scores WHERE user_id = ?)
      ORDER BY RANDOM()
      LIMIT ?
    `).all(grade, userId, count);

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

module.exports = router;
