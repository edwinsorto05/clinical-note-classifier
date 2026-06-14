import React, { useState, useRef } from 'react';
import './App.css';

const COLORS = {
  Cardiology:       '#f97316',
  Neurology:        '#a855f7',
  Orthopedics:      '#d4b896',
  Gastroenterology: '#c084fc',
  Other:            '#7c3aed'
};

const ICONS = {
  Cardiology:       '❤️',
  Neurology:        '🧠',
  Orthopedics:      '🦴',
  Gastroenterology: '🫁',
  Other:            '🏥'
};

const ACUITY = {
  Cardiology:       { level: 'Urgent', color: '#ef4444', desc: 'Requires prompt cardiology evaluation. Possible cardiac event.' },
  Neurology:        { level: 'Urgent', color: '#ef4444', desc: 'Neurological symptoms require immediate specialist assessment.' },
  Orthopedics:      { level: 'Routine', color: '#22c55e', desc: 'Schedule orthopedic consultation within 1-2 weeks.' },
  Gastroenterology: { level: 'Semi-Urgent', color: '#f59e0b', desc: 'GI evaluation recommended within 48-72 hours.' },
  Other:            { level: 'Review', color: '#6b8fa8', desc: 'Further review needed to determine appropriate specialty.' }
};

const REFERRALS = {
  Cardiology:       ['Cardiology', 'Cardiovascular Surgery'],
  Neurology:        ['Neurology', 'Neurosurgery'],
  Orthopedics:      ['Orthopedics', 'Physical Therapy', 'Sports Medicine'],
  Gastroenterology: ['Gastroenterology', 'General Surgery'],
  Other:            ['General Medicine', 'Internal Medicine']
};

const SAMPLES = [
  { label: 'Cardiology', text: 'Patient presents with chest pain radiating to left arm, ST elevation on EKG, troponin elevated at 2.4. History of hypertension. Started on aspirin, nitroglycerin, heparin drip. Impression: Acute inferior STEMI.' },
  { label: 'Neurology', text: 'Patient with sudden onset severe headache, worst of life, neck stiffness, photophobia. CT negative for hemorrhage. LP shows cloudy fluid, WBC 1200 neutrophil predominant. Started ceftriaxone. Diagnosis: Bacterial meningitis.' },
  { label: 'Orthopedics', text: 'Patient presents with right knee pain after sports injury. MRI shows complete ACL tear with bone bruising. Discussed surgical options including ACL reconstruction with patellar tendon autograft.' },
  { label: 'Gastroenterology', text: 'Colonoscopy performed for screening. Three polyps found in sigmoid colon, removed via polypectomy. Pathology shows tubular adenoma. Recommend follow up colonoscopy in 3 years.' },
  { label: 'Other', text: 'Fiebre alta y dolor de garganta en paciente de 8 años. Se observa eritema faríngeo con exudado. Prueba rápida de estreptococo positiva. Se prescribe amoxicilina 500mg.' }
];

export default function App() {
  const [note,      setNote]      = useState('');
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const fileRef = useRef(null);

  const handleAnalyze = async () => {
    if (!note.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setShowModal(true);
    } catch {
      setError('Could not connect to model. Make sure Flask is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNote(ev.target.result);
      setResult(null);
      setError('');
    };
    reader.readAsText(file);
  };

  const handleSample = (text) => {
    setNote(text);
    setResult(null);
    setError('');
  };

  const highlightKeywords = (text, keywords) => {
    if (!keywords || keywords.length === 0) return text;
    const regex = new RegExp(
      `\\b(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi'
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      keywords.some(k => k.toLowerCase() === part.toLowerCase())
        ? <mark key={i} className="highlight">{part}</mark>
        : part
    );
  };

  const color  = result ? COLORS[result.prediction] : null;
  const acuity = result ? ACUITY[result.prediction] : null;
  const topTwo = result
    ? Object.entries(result.probabilities).sort((a, b) => b[1] - a[1]).slice(0, 2)
    : [];

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">⚕ ClinicalAI <span>Classifier</span></div>
          <div className="header-sub">Medical specialty classification · CodaMetrix Hackathon 2026</div>
        </div>
        <div className="header-badge">Team Demo</div>
      </header>

      <main className="main">
        {/* Left panel */}
        <div className="left-panel">
          <div className="panel">
            <div className="panel-header">
              <h2>Clinical Note</h2>
              <div className="sample-row">
                <span className="sample-label">Samples:</span>
                {SAMPLES.map((s, i) => (
                  <button key={i} className="btn-sample"
                    style={{ borderColor: COLORS[s.label] }}
                    onClick={() => handleSample(s.text)}>
                    {ICONS[s.label]} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {result ? (
              <div className="note-display">
                {highlightKeywords(note, result.keywords)}
              </div>
            ) : (
              <textarea
                className="note-input"
                placeholder="Paste a clinical note here, or upload a file..."
                value={note}
                onChange={e => { setNote(e.target.value); setResult(null); }}
              />
            )}

            <div className="input-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="char-count">{note.length} chars</span>
                <button className="btn-upload" onClick={() => fileRef.current.click()}>
                  📎 Upload File
                </button>
                <input ref={fileRef} type="file" accept=".txt,.dat,.csv"
                  style={{ display: 'none' }} onChange={handleFileUpload} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {result && (
                  <button className="btn-secondary" onClick={() => setResult(null)}>
                    Edit Note
                  </button>
                )}
                <button className="btn-primary" onClick={handleAnalyze}
                  disabled={!note.trim() || loading}>
                  {loading ? '⏳ Analyzing...' : '🔍 Classify'}
                </button>
              </div>
            </div>
          </div>
          {error && <div className="alert-error">{error}</div>}
        </div>

        {/* Right panel */}
        <div className="right-panel">
          {!result && !loading && (
            <div className="empty-state">
              <div className="empty-icon">⚕</div>
              <div className="empty-title">Paste a clinical note and click Classify</div>
              <div className="empty-sub">The model predicts medical specialty and shows which keywords drove the decision.</div>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <div className="spinner" />
              <div className="empty-title">Analyzing note...</div>
            </div>
          )}

          {result && (
            <>
              <div className="prediction-card" style={{ borderColor: color }}>
                <div className="prediction-label">Predicted Specialty</div>
                <div className="prediction-value" style={{ color }}>
                  {ICONS[result.prediction]} {result.prediction}
                </div>
                <div className="prediction-confidence" style={{ color }}>
                  {result.confidence}% confidence
                </div>
                <div className="acuity-row" style={{ borderColor: acuity.color }}>
                  <span className="acuity-badge" style={{ background: acuity.color }}>
                    {acuity.level}
                  </span>
                  <span className="acuity-desc">{acuity.desc}</span>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><h2>Referral Recommendation</h2></div>
                <div className="referral-body">
                  {topTwo.map(([specialty, pct]) => (
                    <div key={specialty} className="referral-row">
                      <div className="referral-left">
                        <span style={{ color: COLORS[specialty], fontSize: '1.2rem' }}>
                          {ICONS[specialty]}
                        </span>
                        <div>
                          <div className="referral-specialty" style={{ color: COLORS[specialty] }}>
                            {specialty}
                          </div>
                          <div className="referral-subs">
                            {REFERRALS[specialty].join(' · ')}
                          </div>
                        </div>
                      </div>
                      <div className="referral-pct" style={{ color: COLORS[specialty] }}>
                        {pct}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><h2>All Probabilities</h2></div>
                <div className="prob-list">
                  {Object.entries(result.probabilities)
                    .sort((a, b) => b[1] - a[1])
                    .map(([specialty, pct]) => (
                      <div key={specialty} className="prob-row">
                        <div className="prob-label">{ICONS[specialty]} {specialty}</div>
                        <div className="prob-bar-wrap">
                          <div className="prob-bar"
                            style={{ width: `${pct}%`, background: COLORS[specialty] }} />
                        </div>
                        <div className="prob-pct">{pct}%</div>
                      </div>
                    ))}
                </div>
              </div>

              {result.keywords && result.keywords.length > 0 && (
                <div className="panel">
                  <div className="panel-header"><h2>Key Terms That Drove This Decision</h2></div>
                  <div className="keywords-wrap">
                    {result.keywords.map((kw, i) => (
                      <span key={i} className="keyword-pill" style={{ borderColor: color, color }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Professional popup modal */}
      {showModal && result && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderColor: color }}>
              <div className="modal-icon">{ICONS[result.prediction]}</div>
              <div>
                <div className="modal-title" style={{ color }}>{result.prediction}</div>
                <div className="modal-sub">Classification Result</div>
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <span className="modal-label">Confidence</span>
                <span className="modal-value" style={{ color }}>{result.confidence}%</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Acuity Level</span>
                <span className="modal-value" style={{ color: acuity.color }}>{acuity.level}</span>
              </div>
              <div className="modal-note">{acuity.desc}</div>
              <div className="modal-section">Recommended Referrals</div>
              {topTwo.map(([specialty, pct]) => (
                <div key={specialty} className="modal-referral">
                  <span>{ICONS[specialty]} {specialty}</span>
                  <span style={{ color: COLORS[specialty] }}>{pct}%</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowModal(false)}>
                View Full Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        Built for CodaMetrix Calling Hackathon · June 13 2026 · Edwin Sorto Rosales · Kavya Sura · Shyam Sriram
      </footer>
    </div>
  );
}