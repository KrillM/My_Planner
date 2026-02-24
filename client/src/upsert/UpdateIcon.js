import '../styles/update_icon.scss';

export default function UpdateIcon({ onClick }) {
  return (
    <button
      type="button"
      className="floating-update"
      onClick={onClick}
    >
      <span className="material-symbols-outlined">edit</span>
    </button>
  );
}