import { useState, useRef, useCallback } from 'react';
import { createRecognition, speak } from '../utils/speech';
import { lookupJisho, translateToJapanese, getFurigana } from '../utils/api';

function FuriganaText({ tokens }) {
  return (
    <span className="furigana-text">
      {tokens.map((t, i) =>
        t.hasKanji ? (
          <ruby key={i}>
            {t.text}
            <rt>{t.reading}</rt>
          </ruby>
        ) : (
          <span key={i}>{t.text}</span>
        )
      )}
    </span>
  );
}

export default function JapaneseMode({ onBack }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  const startListening = useCallback(() => {
    setTranscript('');
    transcriptRef.current = '';
    setResult(null);

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

    setLoading(true);

    try {
      const wordCount = text.split(/\s+/).length;

      if (wordCount <= 2) {
        // Try Jisho first for short queries
        try {
          const jishoResult = await lookupJisho(text);
          if (jishoResult) {
            const tokens = jishoResult.word
              ? await getFurigana(jishoResult.word)
              : [];
            setResult({
              type: 'jisho',
              english: text,
              japanese: jishoResult.word,
              reading: jishoResult.reading,
              senses: jishoResult.senses,
              furigana: tokens,
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Jisho lookup failed, falling back to DeepL:', e);
        }
        // Fall through to DeepL if Jisho has no results or failed
      }

      // Use DeepL for sentences or Jisho fallback
      const translated = await translateToJapanese(text);
      if (translated) {
        const tokens = await getFurigana(translated);
        setResult({
          type: 'deepl',
          english: text,
          japanese: translated,
          furigana: tokens,
        });
      } else {
        setResult({ type: 'error', english: text });
      }
    } catch (e) {
      console.error('Translation error:', e);
      setResult({ type: 'error', english: text });
    }

    setLoading(false);
  }, []);

  const speakJapanese = () => {
    if (result?.japanese) {
      speak(result.japanese, 'ja-JP', 0.85);
    }
  };

  return (
    <div className="mode-page japanese-page">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2 className="mode-title japanese-color">How to say in Japanese</h2>
      <p className="mode-instruction">Say something in English!</p>

      <div className="mic-controls">
        {!listening ? (
          <button className="mic-btn japanese-bg" onClick={startListening}>
            🎤 Start
          </button>
        ) : (
          <button className="mic-btn stop-bg" onClick={stopListening}>
            ⏹ Stop
          </button>
        )}
      </div>

      {transcript && (
        <div className="english-text">"{transcript}"</div>
      )}

      {listening && (
        <div className="pulse-indicator japanese-bg" />
      )}

      {loading && <div className="loading">Translating...</div>}

      {result && result.type !== 'error' && (
        <div className="jp-result-card">
          {result.type === 'jisho' && (
            <>
              <div className="jp-word">
                {result.furigana.length > 0 ? (
                  <FuriganaText tokens={result.furigana} />
                ) : (
                  <span>{result.japanese}</span>
                )}
              </div>
              {result.reading && result.reading !== result.japanese && (
                <div className="jp-reading">{result.reading}</div>
              )}
              <div className="jp-senses">
                {result.senses.map((s, i) => (
                  <div className="jp-sense" key={i}>
                    {s.parts.length > 0 && (
                      <span className="pos-badge">{s.parts[0]}</span>
                    )}
                    <span>{s.english}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {result.type === 'deepl' && (
            <div className="jp-word">
              {result.furigana.length > 0 ? (
                <FuriganaText tokens={result.furigana} />
              ) : (
                <span>{result.japanese}</span>
              )}
            </div>
          )}

          <button className="speak-jp-btn" onClick={speakJapanese}>
            🔊 Listen
          </button>
        </div>
      )}

      {result?.type === 'error' && (
        <div className="error-card">
          Could not translate. Please try again.
        </div>
      )}
    </div>
  );
}
