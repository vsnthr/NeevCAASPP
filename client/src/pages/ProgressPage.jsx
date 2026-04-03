import { useState, useEffect } from 'react';
import { getScoresSummary, getStats } from '../api';

const DOMAIN_FULL = {
  NBT: 'Number & Operations: Base Ten',
  NF:  'Number & Operations: Fractions',
  OA:  'Operations & Algebraic Thinking',
  MD:  'Measurement & Data',
  G:   'Geometry',
};

export default function ProgressPage() {
  const [summary,    setSummary]    = useState([]);
  const [stats,      setStats]      = useState({});  // { [topic_id]: { total_questions, answered } }
  const [loading,    setLoading]    = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([getScoresSummary(), getStats()])
      .then(([summaryData, statsData]) => {
        setSummary(summaryData);
        // Index stats by topic_id for easy lookup
        const map = {};
        for (const row of statsData) map[row.topic_id] = row;
        setStats(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={loadingMsg}>Loading progress…</div>;

  const totalCorrect   = summary.reduce((s, d) => s + d.total_correct, 0);
  const totalWrong     = summary.reduce((s, d) => s + d.total_wrong,   0);
  const totalAttempts  = totalCorrect + totalWrong;
  const totalAvailable = Object.values(stats).reduce((s, t) => s + t.total_questions, 0);
  const totalAnswered  = Object.values(stats).reduce((s, t) => s + t.answered, 0);

  const allTopics = summary.flatMap(d => d.topics);
  const maxTotal  = Math.max(1, ...allTopics.map(t => t.correct + t.wrong));

  // Build a unified domain list from stats (so unattempted domains still show)
  const allDomains = Object.values(
    Object.values(stats).reduce((acc, t) => {
      if (!acc[t.subject_id]) acc[t.subject_id] = { subject_id: t.subject_id, subject: t.subject, topics: [] };
      acc[t.subject_id].topics.push(t);
      return acc;
    }, {})
  );

  return (
    <div style={page}>
      <div style={container}>
        {/* Header */}
        <div style={headerRow}>
          <div>
            <h1 style={pageTitle}>📊 Neev's Progress</h1>
            <div style={overallStats}>
              {totalAttempts > 0 && (
                <span style={statChip}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>{totalCorrect}</span>
                  <span style={{ color: '#9ca3af' }}> / {totalAttempts} correct</span>
                  <span style={{ color: '#1d4ed8', fontWeight: 600 }}> ({Math.round(totalCorrect / totalAttempts * 100)}%)</span>
                </span>
              )}
              <span style={statChip}>
                <span style={{ fontWeight: 700, color: '#374151' }}>{totalAnswered}</span>
                <span style={{ color: '#9ca3af' }}> / {totalAvailable} questions answered</span>
              </span>
            </div>
          </div>
        </div>

        <div style={domainList}>
          {allDomains.map(domain => {
            const scoreDomain = summary.find(s => s.subject_id === domain.subject_id);
            const domainCorrect = scoreDomain?.total_correct ?? 0;
            const domainWrong   = scoreDomain?.total_wrong   ?? 0;
            const domainTotal   = domain.topics.reduce((s, t) => s + t.total_questions, 0);
            const domainAnswered = domain.topics.reduce((s, t) => s + t.answered, 0);

            return (
              <div key={domain.subject_id} style={domainCard}>
                <div style={domainHeaderRow}>
                  <div>
                    <span style={domainAbbr}>{domain.subject}</span>
                    <span style={domainFull}>{DOMAIN_FULL[domain.subject] || domain.subject}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {(domainCorrect + domainWrong) > 0 && (
                      <span style={domainScore}>{domainCorrect}✓ {domainWrong}✗</span>
                    )}
                    <span style={coveredChip}>
                      {domainAnswered} / {domainTotal} answered
                    </span>
                  </div>
                </div>

                <div style={topicList}>
                  {domain.topics.map(t => {
                    const scoreT   = scoreDomain?.topics.find(st => st.topic_id === t.topic_id);
                    const correct  = scoreT?.correct  ?? 0;
                    const wrong    = scoreT?.wrong    ?? 0;
                    const avgSecs  = scoreT?.avg_seconds ?? null;
                    const pCorrect = (correct / maxTotal) * 100;
                    const pWrong   = (wrong   / maxTotal) * 100;
                    const pctDone  = Math.round((t.answered / t.total_questions) * 100);

                    return (
                      <div key={t.topic_id} style={topicRow}>
                        <div style={topicLabel}>{t.topic}</div>
                        <div style={barTrack}>
                          {correct > 0 && (
                            <div style={{ ...barSeg, width: `${pCorrect}%`, background: '#22c55e', borderRadius: wrong === 0 ? '6px' : '6px 0 0 6px' }} />
                          )}
                          {wrong > 0 && (
                            <div style={{ ...barSeg, width: `${pWrong}%`, background: '#ef4444', borderRadius: correct === 0 ? '6px' : '0 6px 6px 0' }} />
                          )}
                        </div>
                        <div style={topicStats}>
                          {(correct + wrong) > 0 ? (
                            <>
                              <span style={cNum}>{correct}✓</span>
                              <span style={wNum}>{wrong}✗</span>
                            </>
                          ) : (
                            <span style={notStarted}>not started</span>
                          )}
                          {avgSecs && <span style={timeNum}>~{avgSecs}s</span>}
                          <span style={{ ...coveredMini, color: pctDone === 100 ? '#16a34a' : pctDone > 0 ? '#1d4ed8' : '#9ca3af' }}>
                            {t.answered}/{t.total_questions}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const page       = { minHeight: 'calc(100vh - 60px)', background: '#f3f4f6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' };
const loadingMsg = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)', color: '#6b7280', fontSize: 15 };
const container  = { maxWidth: 800, margin: '0 auto', padding: '32px 20px 60px' };

const headerRow    = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 };
const pageTitle    = { margin: '0 0 8px', fontSize: 26, fontWeight: 700, color: '#111827' };
const overallStats = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const statChip     = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '4px 14px', fontSize: 13 };

const domainList     = { display: 'flex', flexDirection: 'column', gap: 20 };
const domainCard     = { background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '20px 24px' };
const domainHeaderRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 };
const domainAbbr     = { fontSize: 15, fontWeight: 800, color: '#1d4ed8', marginRight: 8 };
const domainFull     = { fontSize: 13, color: '#6b7280', fontWeight: 500 };
const domainScore    = { fontSize: 13, fontWeight: 600, color: '#6b7280' };
const coveredChip    = { background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 };

const topicList  = { display: 'flex', flexDirection: 'column', gap: 8 };
const topicRow   = { display: 'flex', alignItems: 'center', gap: 10 };
const topicLabel = { width: 180, fontSize: 13, color: '#374151', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const barTrack   = { flex: 1, height: 12, background: '#f3f4f6', borderRadius: 6, display: 'flex', overflow: 'hidden' };
const barSeg     = { height: '100%', transition: 'width 0.4s ease' };
const topicStats = { display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' };
const cNum       = { fontSize: 12, fontWeight: 700, color: '#16a34a', minWidth: 28, textAlign: 'right' };
const wNum       = { fontSize: 12, fontWeight: 700, color: '#dc2626', minWidth: 28, textAlign: 'right' };
const timeNum    = { fontSize: 11, color: '#9ca3af', minWidth: 36, textAlign: 'right' };
const coveredMini = { fontSize: 11, fontWeight: 700, minWidth: 36, textAlign: 'right' };
const notStarted = { fontSize: 11, color: '#d1d5db', minWidth: 56, textAlign: 'right' };
