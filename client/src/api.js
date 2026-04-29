// Difficulty tier the practice site is currently serving.
// Week 1 (now → CAASPP test): 'very_hard' — stretch questions across all topics.
// Week 2 (last week before test): switch to 'medium' for review/confidence.
// Set to null to fall back to the full mixed pool.
export const ACTIVE_DIFFICULTY = 'very_hard';

export async function getQuizQuestions(count = 10) {
  const params = new URLSearchParams({ count: String(count) });
  if (ACTIVE_DIFFICULTY) params.set('difficulty', ACTIVE_DIFFICULTY);
  const res = await fetch(`/api/questions/quiz?${params}`);
  if (!res.ok) throw new Error('Failed to fetch quiz questions');
  return res.json();
}

export async function submitScore(data) {
  const res = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit score');
  return res.json();
}

export async function getScoresSummary() {
  const res = await fetch('/api/scores/summary');
  if (!res.ok) throw new Error('Failed to fetch scores');
  return res.json();
}

export async function getDailyReview(date) {
  const res = await fetch(`/api/scores/daily?date=${date}`);
  if (!res.ok) throw new Error('Failed to fetch daily review');
  return res.json();
}

export async function getStats() {
  const res = await fetch('/api/scores/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function resetScores() {
  const res = await fetch('/api/scores', { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to reset scores');
  return res.json();
}
