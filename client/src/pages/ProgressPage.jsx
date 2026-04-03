import { useState, useEffect } from 'react';
import { getScoresSummary, resetScores } from '../api';

const DOMAIN_FULL = {
  NBT: 'Number & Operations: Base Ten',
  NF:  'Number & Operations: Fractions',
  OA:  'Operations & Algebraic Thinking',
  MD:  'Measurement & Data',
  G:   'Geometry',
};

export default function ProgressPage() {
  const [summary,    setSummary]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [confirming, setConfirming] = useState(false);

  const load = () => {
    setLoading(true);
    getScoresSummary()
      .then(setSummary)
      .catch(() => setSummary([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleReset = async () => {
    await resetScores();
    setConfirming(false);
    load();
  };

  if (loading) return <div style={loadingMsg}>Loading progress…</div>;

  const totalCorrect  = summary.reduce((s, d) => s + d.total_correct, 0);
  const totalWrong    = summary.reduce((s, d) => s + d.total_wrong,   0);
  const totalAttempts = totalCorrect + totalWrong;

  const allTopics = summary.flatMap(d => d.topics);
  const maxTotal  = Math.max(1, ...allTopics.map(t => t.correct + t.wrong));

  return (
    <div style={page}>
      <div style={container}>
        {/* Header */}
        <div style={headerRow}>
          <div>
            <h1 style={pageTitle}>📊 Neev's Progress</h1>
            {totalAttempts > 0 && (
              <p style={overallStats}>
                <span style={bigCorrect}>{totalCorrect}</span>
                <span style={slash}> / </span>
                <span style={bigTotal}>{totalAttempts}</span>
                <span style={label}> correct overall</span>
                <span style={pct}> ({Math.round(totalCorrect / totalAttempts * 100)}%)</span>
              </p>
            )}
          </div>
          <button onClick={() => setConfirming(true)} style={resetBtn}>Reset All</button>
        </div>

        {/* Reset confirmation */}
        {confirming && (
          <div style={confirmBox}>
            <span>Reset all progress? This cannot be undone.</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleReset} style={confirmYes}>Yes, reset</button>
              <button onClick={() => setConfirming(false)} style={confirmNo}>Cancel</button>
            </div>
          </div>
        )}

        {summary.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <p style={{ color: '#9ca3af', margin: 0 }}>No attempts yet. Start practicing!</p>
          </div>
        ) : (
          <div style={domainList}>
            {summary.map(domain => (
              <div key={domain.subject_id} style={domainCard}>
                <div style={domainHeaderRow}>
                  <div>
                    <span style={domainAbbr}>{domain.subject}</span>
                    <span style={domainFull}>{DOMAIN_FULL[domain.subject] || domain.subject}</span>
                  </div>
                  <span style={domainScore}>{domain.total_correct} / {domain.total_correct + domain.total_wrong}</span>
                </div>

                <div style={topicList}>
                  {domain.topics.map(t => {
                    const total    = t.correct + t.wrong;
                    const pCorrect = (t.correct / maxTotal) * 100;
                    const pWrong   = (t.wrong   / maxTotal) * 100;
                    return (
                      <div key={t.topic_id} style={topicRow}>
                        <div style={topicLabel}>{t.topic}</div>
                        <div style={barTrack}>
                          {t.correct > 0 && (
                            <div style={{ ...barSeg, width: `${pCorrect}%`, background: '#22c55e', borderRadius: t.wrong === 0 ? '6px' : '6px 0 0 6px' }} />
                          )}
                          {t.wrong > 0 && (
                            <div style={{ ...barSeg, width: `${pWrong}%`, background: '#ef4444', borderRadius: t.correct === 0 ? '6px' : '0 6px 6px 0' }} />
                          )}
                        </div>
                        <div style={topicStats}>
                          <span style={cNum}>{t.correct}✓</span>
                          <span style={wNum}>{t.wrong}✗</span>
                          {t.avg_seconds && <span style={timeNum}>~{t.avg_seconds}s</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const page       = { minHeight: 'calc(100vh - 60px)', background: '#f3f4f6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' };
const loadingMsg = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)', color: '#6b7280', fontSize: 15 };
const container  = { maxWidth: 800, margin: '0 auto', padding: '32px 20px 60px' };

const headerRow   = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 };
const pageTitle   = { margin: '0 0 6px', fontSize: 26, fontWeight: 700, color: '#111827' };
const overallStats = { margin: 0, display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' };
const bigCorrect  = { fontSize: 24, fontWeight: 800, color: '#16a34a' };
const slash       = { fontSize: 18, color: '#9ca3af' };
const bigTotal    = { fontSize: 24, fontWeight: 700, color: '#374151' };
const label       = { fontSize: 14, color: '#9ca3af' };
const pct         = { fontSize: 14, fontWeight: 600, color: '#1d4ed8' };
const resetBtn    = { padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' };

const confirmBox  = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#7c2d12' };
const confirmYes  = { padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const confirmNo   = { padding: '6px 14px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer' };

const emptyState  = { textAlign: 'center', padding: '60px 20px' };
const domainList  = { display: 'flex', flexDirection: 'column', gap: 20 };
const domainCard  = { background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '20px 24px' };
const domainHeaderRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 };
const domainAbbr  = { fontSize: 15, fontWeight: 800, color: '#1d4ed8', marginRight: 8 };
const domainFull  = { fontSize: 13, color: '#6b7280', fontWeight: 500 };
const domainScore = { fontSize: 13, fontWeight: 600, color: '#6b7280' };

const topicList   = { display: 'flex', flexDirection: 'column', gap: 8 };
const topicRow    = { display: 'flex', alignItems: 'center', gap: 10 };
const topicLabel  = { width: 180, fontSize: 13, color: '#374151', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const barTrack    = { flex: 1, height: 12, background: '#f3f4f6', borderRadius: 6, display: 'flex', overflow: 'hidden' };
const barSeg      = { height: '100%', transition: 'width 0.4s ease' };
const topicStats  = { display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' };
const cNum        = { fontSize: 12, fontWeight: 700, color: '#16a34a', minWidth: 28, textAlign: 'right' };
const wNum        = { fontSize: 12, fontWeight: 700, color: '#dc2626', minWidth: 28, textAlign: 'right' };
const timeNum     = { fontSize: 11, color: '#9ca3af', minWidth: 36, textAlign: 'right' };
