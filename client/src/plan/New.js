import { useState, useRef } from "react";
import Input from "./Input";
import ModalMemo from "../modals/ModalMemo";
import "../styles/date.scss";

const New = ({ crew }) => {

  const [toDoList, setToDoList] = useState([]);

  const handleAddTodo = ({ slot, start, end, content, isUseAlarm }) => {
    const newId =
      toDoList.length === 0 ? 1 : Math.max(...toDoList.map((t) => t.toDoId)) + 1;

    const time =
      slot === "slot"
        ? `${start}${end ? ` ~ ${end}` : ""}`
        : slot === "morning" ? "오전"
        : slot === "afternoon" ? "오후"
        : slot === "evening" ? "저녁"
        : "밤";

    const newTodo = {
      toDoId: newId,
      time,
      content,
      isUseAlarm,
    };

    setToDoList((prev) => [...prev, newTodo]);
  };

  // 메모 모달창 상태
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);

  // 메모 모달창 동작
  const openMemoModal = () => setIsMemoModalOpen(true);

  // 메모 내용
  const [memo, setMemo] = useState("");

  const handleCloseMemoModal = (data) => {
    setIsMemoModalOpen(false);
  };

  // 메모 내용 저장
  const handleSaveMemo = (data) => {
    setMemo(data);
    setIsMemoModalOpen(false);
    console.log("memo: ", data);
  };

  const calendarRef = useRef(null);

  // 날짜 설정
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [dateSet, setDateSet] = useState("날짜를 달력에서 선택하세요.");

  return (
    <div className="date-container">
      <div className="planner-header">
        <div className="date-content">
          <input
            className="date-detail"
            type="text"
            name="date"
            value={dateSet}
            readOnly
          />
        </div>
        <div className="doc-icon">
          <input 
            ref={calendarRef} 
            type="date" 
            name="date" 
            className="hidden-date" 
            onChange={(e) => {
            const value = e.target.value; // "2026-02-15"
            if (!value) return;
            const [y, m, d] = value.split("-");
            setYear(y);
            setMonth(m);
            setDay(d);
            setDateSet(y+"년 "+m+"월 "+d+"일");
          }}
          />
          <span
            className="material-symbols-outlined"
            onClick={() => calendarRef.current?.showPicker()}
            style={{ cursor: "pointer" }}
          >
            calendar_month
          </span>
          <span className="material-symbols-outlined" onClick={openMemoModal}>description</span>
        </div>
      </div>

      <div className="toDo-list">
        {toDoList.map((toDo) => (
          <div key={toDo.toDoId} className="toDo-detail">
            <div className="toDo-content">
              <span className="toDo-time">{toDo.time}</span>
              <div className="content-row">
                <span className="toDo-content">{toDo.content}</span>      
              </div>
            </div>
            <div className="toDo-checkbox">
              <span className="material-symbols-outlined">edit</span>
            </div>
          </div>
        ))}
      </div>
      <Input addTodo={handleAddTodo}/>

      <button type="submit" className="save-btn">SAVE</button>
      <button type="submit" className="temp-btn">TEMP</button>

      <ModalMemo open={isMemoModalOpen} onConfirm={handleCloseMemoModal} onSave={handleSaveMemo}/>
    </div>
  );
};

export default New;