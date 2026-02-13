import { useState } from "react";
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

  // 완료 모달 확인 버튼 눌렀을 때만 로그아웃/이동
  const handleSaveMemo = () => {
    setIsMemoModalOpen(false);
  };

  return (
    <div className="date-container">
      <div className="planner-header">
        <div className="date-content">
          <input className="date-detail" type="date" name="date"></input>
        </div>
        <div className="doc-icon">
          {/* <span className="material-symbols-outlined">calendar_month</span> */}
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

      <ModalMemo open={isMemoModalOpen} onConfirm={handleSaveMemo}/>
    </div>
  );
};

export default New;