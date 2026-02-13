export async function lookupWord(word) {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const entry = data[0];
  const meanings = entry.meanings.map((m) => ({
    partOfSpeech: m.partOfSpeech,
    definition: m.definitions[0]?.definition || '',
  }));

  return { word: entry.word, phonetic: entry.phonetic || '', meanings };
}

export async function lookupJisho(keyword) {
  const res = await fetch(
    `/api/jisho?keyword=${encodeURIComponent(keyword)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.data || data.data.length === 0) return null;

  const item = data.data[0];
  const japanese = item.japanese[0] || {};
  const senses = item.senses.slice(0, 3).map((s) => ({
    english: s.english_definitions.join(', '),
    parts: s.parts_of_speech,
  }));

  return {
    word: japanese.word || japanese.reading || '',
    reading: japanese.reading || '',
    senses,
  };
}

export async function translateToJapanese(text) {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source_lang: 'EN', target_lang: 'JA' }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.translations || data.translations.length === 0) return null;
  return data.translations[0].text;
}

export async function getFurigana(text) {
  const res = await fetch('/api/tokenize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.furigana || [];
}
