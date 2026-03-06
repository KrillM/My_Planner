export default function DarkMode({ isDark, changeMode }) {
  return (
    <button
      type="button"
      className="darkmode-toggle"
      onClick={changeMode}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      <span className="material-symbols-outlined">
        {isDark ? "light_mode" : "bedtime"}
      </span>

      <span className="darkmode-text">
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}