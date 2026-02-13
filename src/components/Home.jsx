export default function Home({ onNavigate }) {
  return (
    <div className="home">
      <h1 className="home-title">TellMeWords</h1>
      <p className="home-subtitle">Speak and learn!</p>
      <div className="home-buttons">
        <button
          className="mode-btn spell-btn"
          onClick={() => onNavigate('spell')}
        >
          <span className="mode-icon">🔤</span>
          <span className="mode-label">SPELL</span>
          <span className="mode-desc">Say words & see definitions</span>
        </button>
        <button
          className="mode-btn japanese-btn"
          onClick={() => onNavigate('japanese')}
        >
          <span className="mode-icon">🇯🇵</span>
          <span className="mode-label">How to say in Japanese</span>
          <span className="mode-desc">Translate & hear it spoken</span>
        </button>
      </div>
    </div>
  );
}
