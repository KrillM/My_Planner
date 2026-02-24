import { useState, useEffect } from "react";
import "../styles/input.scss";
import "../styles/save.scss";

const UpdateTodo = ({ todo, todoKey, updateTodo, onCancel }) => {
  const [slot, setSlot] = useState("slot");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [content, setContent] = useState("");
  const [isUseTimeSlot, setIsUseTimeSlot] = useState(true);
  const [isUseAlarm, setIsUseAlarm] = useState(false);

  const [isContentEmpty, setIsContentEmpty] = useState(false);
  const [isWrongTimeSlot, setIsWrongTimeSlot] = useState(false);
  const [isTimeEmpty, setIsTimeEmpty] = useState(false);

  // todo 바뀔 때마다 폼 채우기
  useEffect(() => {
    if (!todo) return;

    setContent(todo.content ?? "");
    setIsUseAlarm(!!todo.isUseAlarm);

    // slot이 저장돼 있다면 그걸 우선 사용
    if (todo.slot) {
      setSlot(todo.slot);
      setIsUseTimeSlot(todo.slot === "slot");
    }

    // time 문자열에서 파싱 (slot/start/end가 없을 때 대비)
    const t = todo.time ?? "";

    if (t.includes(":")) {
      setSlot("slot");
      setIsUseTimeSlot(true);

      const [s, e] = t.split(" ~ ").map(v => v.trim());
      setStart(s || "");
      setEnd(e || "");
    } else if (t === "오전" || t === "오후" || t === "저녁" || t === "밤") {
      setIsUseTimeSlot(false);
      setStart("");
      setEnd("");

      if (t === "오전") setSlot("morning");
      if (t === "오후") setSlot("afternoon");
      if (t === "저녁") setSlot("evening");
      if (t === "밤") setSlot("night");
    }

    // 에러 메시지 리셋
    setIsContentEmpty(false);
    setIsWrongTimeSlot(false);
    setIsTimeEmpty(false);
  }, [todo]);

  useEffect(() => {
    setIsWrongTimeSlot(start && end ? start > end : false);
  }, [start, end]);

  const setTime = (start) => {
    if(start !== "") setIsTimeEmpty(false);
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    const contentEmpty = content.trim() === "";
    const wrongTimeSlot = (isUseTimeSlot && end !== "" && start > end);
    const timeEmpty = (slot === "slot" && start === "");

    setIsContentEmpty(contentEmpty);
    setIsWrongTimeSlot(wrongTimeSlot);
    setIsTimeEmpty(timeEmpty);

    if (contentEmpty || wrongTimeSlot || timeEmpty) return;

    // ✅ 반드시 toDoId 포함해서 부모가 어떤 항목 수정할지 알게
    updateTodo?.({
      key: todoKey,   
      slot,
      start,
      end,
      content: content.trim(),
      isUseAlarm
    });
  };

  return (
    <form className="input-wrap" onSubmit={handleSubmit}>
      <div className="slot-row">
        <select
          className="pill pill-label"
          value={slot}
          onChange={(e) => {
            const val = e.target.value;
            setSlot(val);
            setIsUseTimeSlot(val === "slot");
            if (val !== "slot") { setStart(""); setEnd(""); }
          }}
        >
          <option value="slot">Slot</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
          <option value="night">Night</option>
        </select>

        {isUseTimeSlot && (
          <div className="time-group">
            <input 
              className="pill pill-time" 
              type="time" 
              value={start} 
              onChange={(e) => {
                setStart(e.target.value)
                setTime(e.target.value)
              }}/>
            <span className="tilde">~</span>
            <input 
              className="pill pill-time" 
              type="time" 
              value={end} 
              onChange={(e) => setEnd(e.target.value)} />
          </div>
        )}

        <button type="button" className="close-btn" onClick={onCancel}>
          ×
        </button>
      </div>

      <div className="content-row">
        <input
          className="content-input"
          value={content}
          placeholder="To Do"
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="content-icons">
          <button
            type="button"
            className={`icon-btn alert ${isUseAlarm ? "active" : ""}`}
            onClick={() => setIsUseAlarm(prev => !prev)}
          >
            <span className="material-symbols-outlined">add_alert</span>
          </button>

          {/* ✅ 수정 저장 버튼 */}
          <button type="submit" className="icon-btn add">
            <span className="material-symbols-outlined">check</span>
          </button>
        </div>
      </div>

      {isContentEmpty && <p className="warning-message">계획을 입력해주세요.</p>}
      {(isWrongTimeSlot && isUseTimeSlot) && <p className="warning-message">종료시간은 시작시간보다 빠를 수 없습니다.</p>}
      {(isTimeEmpty && isUseTimeSlot) && <p className="warning-message">시작 시간을 입력해주세요.</p>}
    </form>
  );
};

export default UpdateTodo;