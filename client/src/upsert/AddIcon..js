import '../styles/update_icon.scss';

export default function AddIcon({ onClick }) {
  return (
    <button
      type="button"
      className="floating-update"
      onClick={onClick}
    >
      <span className="material-symbols-outlined">add</span>
    </button>
  );
}