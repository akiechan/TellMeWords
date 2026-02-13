import { useState, useRef, useCallback } from 'react';
import { createRecognition, speak } from '../utils/speech';
import { lookupWord } from '../utils/api';

export default function SpellMode({ onBack }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  const startListening = useCallback(() => {
    setTranscript('');
    transcriptRef.current = '';
    setResults([]);

    const recognition = createRecognition({
      lang: 'en-US',
      onResult: (text) => {
        setTranscript(text);
        transcriptRef.current = text;
      },
      onError: (error) => {
        console.error('Speech error:', error);
        setListening(false);
      },
      onEnd: () => {
        setListening(false);
      },
    });

    if (!recognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stopListening = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);

    const text = transcriptRef.current.trim();
    if (!text) return;

    const words = [...new Set(
      text.toLowerCase().split(/\s+/).filter((w) => w.length > 0)
    )];

    setLoading(true);
    const lookups = await Promise.allSettled(words.map((w) => lookupWord(w)));
    const defs = lookups
      .map((r, i) => (r.status === 'fulfilled' && r.value ? r.value : { word: words[i], meanings: [] }))
      .filter(Boolean);
    setResults(defs);
    setLoading(false);
  }, []);

  return (
    <div className="mode-page spell-page">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2 className="mode-title spell-color">SPELL</h2>
      <p className="mode-instruction">Tap the mic and say English words!</p>

      <div className="mic-controls">
        {!listening ? (
          <button className="mic-btn spell-bg" onClick={startListening}>
            🎤 Start
          </button>
        ) : (
          <button className="mic-btn stop-bg" onClick={stopListening}>
            ⏹ Stop
          </button>
        )}
      </div>

      {transcript && (
        <div className="big-word">{transcript}</div>
      )}

      {listening && (
        <div className="pulse-indicator spell-bg" />
      )}

      {loading && <div className="loading">Looking up words...</div>}

      {results.length > 0 && (
        <div className="word-cards">
          {results.map((entry, i) => (
            <div className="word-card" key={i}>
              <div className="word-card-header">
                <span className="word-card-word">{entry.word}</span>
                {entry.phonetic && (
                  <span className="word-card-phonetic">{entry.phonetic}</span>
                )}
                <button
                  className="speak-btn"
                  onClick={() => speak(entry.word, 'en-US')}
                  title="Listen to word"
                >
                  🔊
                </button>
              </div>
              {entry.meanings.length > 0 ? (
                entry.meanings.map((m, j) => (
                  <div className="word-meaning" key={j}>
                    <span className="pos-badge">{m.partOfSpeech}</span>
                    <span className="definition">{m.definition}</span>
                    <button
                      className="speak-btn speak-def-btn"
                      onClick={() => speak(`${entry.word}. ${m.partOfSpeech}. ${m.definition}`, 'en-US', 0.9)}
                      title="Read definition"
                    >
                      🔊
                    </button>
                  </div>
                ))
              ) : (
                <div className="word-meaning">
                  <span className="definition no-def">No definition found</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
