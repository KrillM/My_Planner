import { useMemo, useState } from "react";
import "../styles/date.scss";
import '../styles/save.scss';

const New = ({ crew }) => {

  const toDoList = useMemo(
    () => [
      { toDoId: 1, time: "07:00 ~ 07:30", content: "아침 식사" },
      { toDoId: 2, time: "08:00 ~ 09:30", content: "독서 <자유론>" },
      { toDoId: 3, time: "오전", content: "장보기" },
      { toDoId: 4, time: "13:00 ~ 14:00", content: "점심 - 오리지널 까르보나라" },
      { toDoId: 5, time: "오후", content: "개인 프로젝트 - 검색 기능 구현" },
      { toDoId: 6, time: "18:00 ~ 20:00", content: "한강 공원 러닝" },
    ],
    []
  );

  return (
    <div className="date-container">
      <div className="planner-header">
        <div className="date-content">

        </div>
        <div className="doc-icon">
          <span className="material-symbols-outlined">calendar_month</span>
          <span className="material-symbols-outlined">description</span>
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
      <button type="submit" className="save-btn">SAVE</button>
      <button type="submit" className="temp-btn">TEMP</button>
    </div>
  );
};

export default New;