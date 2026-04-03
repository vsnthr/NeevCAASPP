const express = require('express');
const router = express.Router();
const db = require('../db');

const USER_ID = 1;

// POST /api/scores  { question_id, subject_id, topic_id, is_correct, time_seconds }
router.post('/', (req, res) => {
  const { question_id, subject_id, topic_id, is_correct, time_seconds } = req.body;

  if (question_id == null || subject_id == null || topic_id == null || is_correct == null) {
    return res.status(400).json({ error: 'question_id, subject_id, topic_id, and is_correct are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO scores (user_id, question_id, subject_id, topic_id, is_correct, time_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(USER_ID, question_id, subject_id, topic_id, is_correct ? 1 : 0, time_seconds ?? null);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record score' });
  }
});

// GET /api/scores/summary
// Returns scores grouped by domain → topic with correct/wrong counts
router.get('/summary', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT s.id AS subject_id, s.name AS subject,
             t.id AS topic_id,   t.name AS topic,
             SUM(sc.is_correct)       AS correct,
             SUM(1 - sc.is_correct)   AS wrong,
             AVG(sc.time_seconds)     AS avg_seconds
      FROM scores sc
      JOIN subjects s ON s.id = sc.subject_id
      JOIN topics   t ON t.id = sc.topic_id
      WHERE sc.user_id = ?
      GROUP BY sc.subject_id, sc.topic_id
      ORDER BY s.name ASC, t.name ASC
    `).all(USER_ID);

    const subjectMap = {};
    for (const row of rows) {
      if (!subjectMap[row.subject_id]) {
        subjectMap[row.subject_id] = {
          subject_id: row.subject_id,
          subject: row.subject,
          total_correct: 0,
          total_wrong: 0,
          topics: [],
        };
      }
      const s = subjectMap[row.subject_id];
      s.topics.push({
        topic_id: row.topic_id,
        topic: row.topic,
        correct: row.correct,
        wrong: row.wrong,
        avg_seconds: row.avg_seconds ? Math.round(row.avg_seconds) : null,
      });
      s.total_correct += row.correct;
      s.total_wrong   += row.wrong;
    }

    res.json(Object.values(subjectMap));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// GET /api/scores/daily?date=YYYY-MM-DD
// Returns all questions answered on a given date with full question details
router.get('/daily', (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  try {
    const rows = db.prepare(`
      SELECT sc.id AS score_id, sc.is_correct, sc.time_seconds,
             sc.answered_at,
             q.id AS question_id, q.question, q.answer,
             q.wrong_a, q.wrong_b, q.wrong_c, q.explanation,
             s.name AS subject, t.name AS topic
      FROM scores sc
      JOIN questions q ON q.id = sc.question_id
      JOIN subjects  s ON s.id = sc.subject_id
      JOIN topics    t ON t.id = sc.topic_id
      WHERE sc.user_id = ?
        AND date(sc.answered_at) = date(?)
      ORDER BY sc.answered_at ASC
    `).all(USER_ID, date);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily scores' });
  }
});

// GET /api/scores/stats
// Returns per-topic: total questions available and how many Neev has answered
router.get('/stats', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT s.id AS subject_id, s.name AS subject,
             t.id AS topic_id,   t.name AS topic,
             COUNT(DISTINCT q.id)                                        AS total_questions,
             COUNT(DISTINCT sc.question_id)                              AS answered
      FROM topics t
      JOIN subjects  s  ON s.id = t.subject_id
      JOIN questions q  ON q.topic_id = t.id AND q.active = 1 AND q.grade = 5 AND q.wrong_a IS NOT NULL
      LEFT JOIN scores sc ON sc.question_id = q.id AND sc.user_id = ?
      GROUP BY t.id
      ORDER BY s.name ASC, t.name ASC
    `).all(USER_ID);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// DELETE /api/scores  — reset all scores for Neev
router.delete('/', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM scores WHERE user_id = ?').run(USER_ID);
    res.json({ deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset scores' });
  }
});

module.exports = router;
