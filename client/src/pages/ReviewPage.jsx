import { useState, useEffect } from 'react';
import { getDailyReview } from '../api';

function fmt(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReviewPage() {
  const [date,       setDate]    = useState(today());
  const [rows,       setRows]    = useState([]);
  const [loading,    setLoading] = useState(true);
  const [idx,        setIdx]     = useState(0);

  useEffect(() => {
    setLoading(true);
    setIdx(0);
    getDailyReview(date)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [date]);

  const current   = rows[idx];
  const isFirst   = idx === 0;
  const isLast    = idx === rows.length - 1;
  const correct   = rows.filter(r => r.is_correct).length;

  return (
    <div style={page}>
      <div style={container}>
        <div style={headerRow}>
          <h1 style={pageTitle}>📅 Daily Review</h1>
          <input
            type="date"
            value={date}
            max={today()}
            onChange={e => setDate(e.target.value)}
            style={datePicker}
          />
        </div>

        {loading ? (
          <div style={loadingMsg}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ color: '#9ca3af', margin: 0 }}>No questions answered on {fmt(date)}.</p>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div style={summaryBar}>
              <span style={summaryText}>{fmt(date)}</span>
              <span style={summaryScore}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>{correct}</span>
                <span style={{ color: '#9ca3af' }}> / {rows.length} correct</span>
              </span>
              <span style={summaryNav}>{idx + 1} of {rows.length}</span>
            </div>

            {/* Question review card */}
            {current && (
              <div style={card}>
                <div style={pillRow}>
                  <span style={domainPill}>{current.subject}</span>
                  <span style={topicPill}>{current.topic}</span>
                  <span style={{ ...resultBadge, background: current.is_correct ? '#f0fdf4' : '#fef2f2', color: current.is_correct ? '#166534' : '#991b1b', border: `1px solid ${current.is_correct ? '#bbf7d0' : '#fecaca'}` }}>
                    {current.is_correct ? '✅ Correct' : '❌ Incorrect'}
                  </span>
                  {current.time_seconds != null && (
                    <span style={timeBadge}>⏱ {current.time_seconds}s</span>
                  )}
                </div>

                <p style={questionText}>{current.question}</p>

                {/* All choices with highlighting */}
                <div style={choiceList}>
                  {[current.answer, current.wrong_a, current.wrong_b, current.wrong_c]
                    .filter(Boolean)
                    .sort() // consistent order
                    .map((choice, i) => {
                      const isCorrectChoice = choice === current.answer;
                      // We don't store what Neev chose, but we know if it was correct
                      // Highlight correct answer always; if wrong, also tint the card
                      let bg = '#f9fafb', border = '1.5px solid #e5e7eb', color = '#374151';
                      if (isCorrectChoice) { bg = '#f0fdf4'; border = '2px solid #22c55e'; color = '#166534'; }
                      return (
                        <div key={i} style={{ ...choiceRow, background: bg, border, color }}>
                          {isCorrectChoice && <span style={checkMark}>✓</span>}
                          {!isCorrectChoice && <span style={spacer} />}
                          {choice}
                        </div>
                      );
                    })}
                </div>

                {current.explanation && (
                  <div style={explanationBox}>
                    <span style={{ fontSize: 16 }}>📖</span>
                    <span>{current.explanation}</span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div style={navRow}>
              <button onClick={() => setIdx(i => i - 1)} disabled={isFirst} style={{ ...navBtn, opacity: isFirst ? 0.3 : 1 }}>
                ← Prev
              </button>
              <button onClick={() => setIdx(i => i + 1)} disabled={isLast} style={{ ...navBtn, opacity: isLast ? 0.3 : 1 }}>
                Next →
              </button>
            </div>

            {/* Topic breakdown */}
            <div style={topicSection}>
              <h3 style={topicHeader}>Today's Topics</h3>
              {Object.entries(
                rows.reduce((acc, r) => {
                  const k = `${r.subject} — ${r.topic}`;
                  if (!acc[k]) acc[k] = { correct: 0, total: 0 };
                  acc[k].total++;
                  if (r.is_correct) acc[k].correct++;
                  return acc;
                }, {})
              ).map(([key, val]) => (
                <div key={key} style={topicRow}>
                  <span style={topicName}>{key}</span>
                  <span style={{ color: val.correct === val.total ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 13 }}>
                    {val.correct}/{val.total}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const page       = { minHeight: 'calc(100vh - 60px)', background: '#f3f4f6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' };
const loadingMsg = { textAlign: 'center', padding: '48px 0', color: '#9ca3af' };
const container  = { maxWidth: 680, margin: '0 auto', padding: '32px 20px 60px' };

const headerRow  = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 };
const pageTitle  = { margin: 0, fontSize: 26, fontWeight: 700, color: '#111827' };
const datePicker = { padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#374151', background: '#fff', cursor: 'pointer' };

const summaryBar   = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' };
const summaryText  = { fontSize: 15, fontWeight: 600, color: '#374151' };
const summaryScore = { fontSize: 15 };
const summaryNav   = { marginLeft: 'auto', fontSize: 13, color: '#9ca3af' };

const emptyState = { textAlign: 'center', padding: '60px 20px' };

const card       = { background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '24px', marginBottom: 16 };
const pillRow    = { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' };
const domainPill = { background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 };
const topicPill  = { background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 };
const resultBadge = { borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 };
const timeBadge  = { background: '#f3f4f6', color: '#9ca3af', borderRadius: 20, padding: '3px 10px', fontSize: 12 };

const questionText = { margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.5 };
const choiceList   = { display: 'flex', flexDirection: 'column', gap: 8 };
const choiceRow    = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, fontSize: 14, lineHeight: 1.4 };
const checkMark    = { fontSize: 16, fontWeight: 700, color: '#16a34a', flexShrink: 0 };
const spacer       = { width: 16, flexShrink: 0, display: 'inline-block' };
const explanationBox = { display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: 14, color: '#78350f', lineHeight: 1.6 };

const navRow = { display: 'flex', justifyContent: 'space-between', marginBottom: 24 };
const navBtn = { padding: '10px 24px', background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' };

const topicSection = { background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const topicHeader  = { margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' };
const topicRow     = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f4f6' };
const topicName    = { fontSize: 13, color: '#374151' };
