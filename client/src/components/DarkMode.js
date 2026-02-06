import '../styles/darkmode_icon.scss';

export default function DarkMode({ isDark, changeMode }) {
  return (
    <button
      type="button"
      className="floating-moon"
      onClick={changeMode}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      <span className="material-symbols-outlined">bedtime</span>
    </button>
  );
}