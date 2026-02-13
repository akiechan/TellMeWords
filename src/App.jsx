import { useState } from 'react';
import Home from './components/Home';
import SpellMode from './components/SpellMode';
import JapaneseMode from './components/JapaneseMode';

export default function App() {
  const [page, setPage] = useState('home');

  return (
    <div className="app">
      {page === 'home' && <Home onNavigate={setPage} />}
      {page === 'spell' && <SpellMode onBack={() => setPage('home')} />}
      {page === 'japanese' && <JapaneseMode onBack={() => setPage('home')} />}
    </div>
  );
}
