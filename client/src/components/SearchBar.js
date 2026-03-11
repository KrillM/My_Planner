import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/input.scss";

const SearchBar = ({ onClose }) => {
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const inputToDo = (value) => {
    setContent(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const keyword = content.trim();
    if (!keyword) return;

    navigate(`/search?keyword=${encodeURIComponent(keyword)}&type=date`);
    onClose?.();
  };

  return (
    <form className="input-wrap" onSubmit={handleSubmit}>
      <div className="content-row">
        <input
          className="content-input"
          value={content}
          placeholder="검색어를 입력하세요."
          onChange={(e) => inputToDo(e.target.value)}
        />

        <div className="content-icons">
          <button type="submit" className="icon-btn add" aria-label="search">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;