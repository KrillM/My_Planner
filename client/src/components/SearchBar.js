import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/input.scss";

const SearchBar = ({ onClose }) => {
  const [content, setContent] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const currentType = searchParams.get("type") || "date";
  const currentDateBegin = searchParams.get("dateBegin") || "";
  const currentDateEnd = searchParams.get("dateEnd") || "";

  const handleSubmit = (e) => {
    e.preventDefault();

    const keyword = content.trim();
    if (!keyword) return;

    const nextParams = new URLSearchParams({
      keyword,
      type: currentType,
    });

    if (currentType !== "frequency") {
      if (currentDateBegin) nextParams.set("dateBegin", currentDateBegin);
      if (currentDateEnd) nextParams.set("dateEnd", currentDateEnd);
    }

    navigate(`/search?${nextParams.toString()}`);
    setContent("");
    onClose?.();
  };

  return (
    <form className="input-wrap" onSubmit={handleSubmit}>
      <div className="content-row">
        <input
          className="content-input"
          value={content}
          placeholder="검색어를 입력하세요."
          onChange={(e) => setContent(e.target.value)}
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