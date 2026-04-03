export async function getQuizQuestions(count = 10) {
  const res = await fetch(`/api/questions/quiz?count=${count}`);
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
