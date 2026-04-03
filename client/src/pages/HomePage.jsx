import { useState, useEffect, useRef, useCallback } from 'react';
import { getQuizQuestions, submitScore } from '../api';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSession(questions) {
  return questions.map(q => ({
    ...q,
    choices: shuffle([q.answer, q.wrong_a, q.wrong_b, q.wrong_c]),
  }));
}

export default function HomePage() {
  const [session,    setSession]    = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers,    setAnswers]    = useState({});  // { [qid]: { selected, isCorrect, seconds } }
  const [pending,    setPending]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitted,  setSubmitted]  = useState(false);
  const questionStartTime = useRef(null);
  const touchStartX = useRef(null);

  // Inject animations once
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'home-anim';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity:0; transform:translateY(-6px); }
        to   { opacity:1; transform:translateY(0); }
      }
      .choice-btn:hover:not(:disabled) { background:#eff6ff !important; }
    `;
    document.head.appendChild(style);
    return () => { const s = document.getElementById('home-anim'); if (s) s.remove(); };
  }, []);

  const loadSession = useCallback((count = 10) => {
    setLoading(true);
    setAnswers({});
    setPending(null);
    setCurrentIdx(0);
    setSubmitted(false);
    getQuizQuestions(count)
      .then(qs => {
        setSession(buildSession(qs));
        questionStartTime.current = Date.now();
      })
      .catch(() => setSession([]))
      .finally(() => setLoading(false));
  }, []);

  // Load on mount
  useEffect(() => { loadSession(10); }, [loadSession]);

  // Reset timer when question changes
  useEffect(() => {
    questionStartTime.current = Date.now();
    setSubmitted(false);
    setPending(null);
  }, [currentIdx]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) { if (delta > 0) goNext(); else goPrev(); }
    touchStartX.current = null;
  };

  const goNext = () => {
    if (currentIdx < session.length - 1) setCurrentIdx(i => i + 1);
  };
  const goPrev = () => setCurrentIdx(i => Math.max(i - 1, 0));

  const handleSubmit = () => {
    if (!pending || !current || submitted) return;
    const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
    const isCorrect = pending === current.answer;
    setSubmitted(true);
    setAnswers(prev => ({ ...prev, [current.id]: { selected: pending, isCorrect, seconds: elapsed } }));
    submitScore({
      question_id: current.id,
      subject_id:  current.subject_id,
      topic_id:    current.topic_id,
      is_correct:  isCorrect,
      time_seconds: elapsed,
    }).catch(() => {});
  };

  const current      = session[currentIdx];
  const answered     = current ? answers[current.id] : null;
  const isFirst      = currentIdx === 0;
  const isLast       = currentIdx === session.length - 1;
  const totalAnswered = Object.keys(answers).length;
  const totalCorrect  = Object.values(answers).filter(a => a.isCorrect).length;

  if (loading) return <div style={loadingMsg}>Loading questions…</div>;

  return (
    <div style={page} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={inner}>
        {session.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <p style={{ color: '#1e40af', fontWeight: 700, fontSize: 20, margin: '0 0 8px' }}>All questions answered!</p>
            <p style={{ color: '#6b7280', margin: '0 0 24px' }}>You've completed all available CAASPP questions. Reset to practice again.</p>
            <button onClick={() => loadSession(10)} style={newQuizBtn}>Load More Questions</button>
          </div>
        ) : (
          <div style={quizWrap}>
            {/* Score bar */}
            <div style={scoreSummary}>
              <span style={progressTxt}>{currentIdx + 1} / {session.length}</span>
              {totalAnswered > 0 && (
                <span style={scoreTag}>✅ {totalCorrect} / {totalAnswered} correct</span>
              )}
              <button onClick={() => loadSession(10)} style={moreBtn}>+ More Questions</button>
            </div>

            {/* Question card */}
            <div style={card}>
              <div style={pillRow}>
                <span style={domainPill}>{current.subject}</span>
                <span style={topicPill}>{current.topic}</span>
              </div>

              <p style={questionText}>{current.question}</p>

              <div style={choiceList}>
                {current.choices.map((choice, idx) => {
                  const isPending  = pending === choice && !submitted;
                  const isSelected = answered?.selected === choice;
                  const isCorrect  = choice === current.answer;

                  let bg = '#f9fafb', border = '1.5px solid #e5e7eb', color = '#111827';
                  if (submitted || answered) {
                    if (isCorrect)                    { bg = '#f0fdf4'; border = '2px solid #22c55e'; color = '#166534'; }
                    else if (isSelected && !isCorrect){ bg = '#fef2f2'; border = '2px solid #ef4444'; color = '#991b1b'; }
                  } else if (isPending) {
                    bg = '#eff6ff'; border = '2px solid #1d4ed8'; color = '#1e40af';
                  }

                  return (
                    <button
                      key={idx}
                      className="choice-btn"
                      disabled={!!(submitted || answered)}
                      onClick={() => setPending(choice)}
                      style={{ ...choiceBtn, background: bg, border, color }}
                    >
                      <span style={{
                        ...choiceLetter,
                        background: (isPending || (submitted && isCorrect) || (answered && isCorrect))
                          ? (isCorrect ? '#22c55e' : (isSelected ? '#ef4444' : '#1d4ed8'))
                          : '#e5e7eb',
                        color: (isPending || (submitted && isCorrect) || (answered && isSelected)) ? '#fff' : '#6b7280',
                      }}>
                        {['A','B','C','D'][idx]}
                      </span>
                      {choice}
                    </button>
                  );
                })}
              </div>

              {/* Submit button — only before submitting */}
              {!submitted && !answered && (
                <button
                  onClick={handleSubmit}
                  disabled={!pending}
                  style={{ ...submitBtn, opacity: pending ? 1 : 0.4, cursor: pending ? 'pointer' : 'default' }}
                >
                  Submit Answer
                </button>
              )}

              {/* Feedback — shown after submit, stays until Next is clicked */}
              {(submitted || answered) && (() => {
                const a = answered || { selected: pending, isCorrect: pending === current.answer };
                return (
                  <div style={{ animationName: 'fadeIn', animationDuration: '0.3s', animationFillMode: 'both' }}>
                    <div style={{ ...feedbackBox, background: a.isCorrect ? '#f0fdf4' : '#fef2f2', border: `1px solid ${a.isCorrect ? '#bbf7d0' : '#fecaca'}` }}>
                      <span style={{ fontSize: 20 }}>{a.isCorrect ? '✅' : '❌'}</span>
                      <span style={{ fontWeight: 600, color: a.isCorrect ? '#166534' : '#991b1b' }}>
                        {a.isCorrect ? 'Correct!' : `Not quite — the answer is: ${current.answer}`}
                      </span>
                      {(answered?.seconds ?? (submitted && Math.round((Date.now() - questionStartTime.current) / 1000))) > 0 && (
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>
                          ⏱ {answered?.seconds ?? '—'}s
                        </span>
                      )}
                    </div>
                    {current.explanation && (
                      <div style={explanationBox}>
                        <span style={{ fontSize: 16 }}>📖</span>
                        <span>{current.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Navigation — Next is separate from Submit */}
            <div style={navRow}>
              <button onClick={goPrev} disabled={isFirst} style={{ ...navBtn, opacity: isFirst ? 0.3 : 1 }}>
                ← Prev
              </button>
              {isLast ? (
                <button onClick={() => loadSession(10)} style={newQuizBtn}>
                  🔀 Load Next Batch
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={isLast}
                  style={{ ...navBtn, opacity: isLast ? 0.3 : 1, background: (submitted || answered) ? '#1d4ed8' : '#fff', color: (submitted || answered) ? '#fff' : '#374151', borderColor: (submitted || answered) ? '#1d4ed8' : '#d1d5db' }}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const page = {
  minHeight: 'calc(100vh - 60px)', background: '#f3f4f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  touchAction: 'pan-y',
};
const loadingMsg = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  height: 'calc(100vh - 60px)', color: '#6b7280', fontSize: 15,
};
const inner   = { maxWidth: 640, margin: '0 auto', padding: '24px 20px 48px' };
const quizWrap = { display: 'flex', flexDirection: 'column', gap: 16 };

const scoreSummary = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' };
const progressTxt  = { color: '#9ca3af', fontSize: 14, fontWeight: 500 };
const scoreTag     = { background: '#dcfce7', color: '#166534', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 };
const moreBtn      = { marginLeft: 'auto', padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' };

const card        = { background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '24px' };
const pillRow     = { display: 'flex', gap: 8, marginBottom: 16 };
const domainPill  = { background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 };
const topicPill   = { background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 };
const questionText = { margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.5 };
const choiceList  = { display: 'flex', flexDirection: 'column', gap: 10 };
const choiceBtn   = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', borderRadius: 10, textAlign: 'left', fontSize: 15, cursor: 'pointer', transition: 'all 0.15s ease', lineHeight: 1.4 };
const choiceLetter = { width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, transition: 'all 0.15s ease' };
const submitBtn   = { marginTop: 20, width: '100%', padding: '13px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, transition: 'opacity 0.2s', cursor: 'pointer' };
const feedbackBox = { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, marginTop: 16, fontSize: 15 };
const explanationBox = { display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginTop: 10, fontSize: 14, color: '#78350f', lineHeight: 1.6, animationName: 'fadeIn', animationDuration: '0.3s', animationDelay: '0.1s', animationFillMode: 'both' };
const navRow      = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navBtn      = { padding: '10px 24px', background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' };
const newQuizBtn  = { padding: '10px 24px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const emptyState  = { textAlign: 'center', padding: '80px 20px' };
