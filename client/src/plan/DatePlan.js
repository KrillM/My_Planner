import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import '../styles/date.scss';

const DatePlan = () => {

  // 임시 데이터
  // const toDoList = [
  //   { toDoId: 1, time: '07:00 ~ 07:30', content: '아침 식사', isDone: true, isUseAlarm: false },
  //   { toDoId: 2, time: '08:00 ~ 08:30', content: 'VOC 파악', isDone: true, isUseAlarm: false },
  //   { toDoId: 3, time: '10:00', content: '티 타임', isDone: true, isUseAlarm: false },
  //   { toDoId: 4, time: '12:00 ~ 13:00', content: '점심 식사', isDone: false, isUseAlarm: false },
  //   { toDoId: 5, time: '오후', content: '업무', isDone: false, isUseAlarm: false },
  //   { toDoId: 6, time: '18:00 ~19:00', content: '저녁 식사', isDone: false, isUseAlarm: false },
  //   { toDoId: 7, time: '저녁', content: '코딩 학습', isDone: false, isUseAlarm: true },
  //   { toDoId: 8, time: '20:00 ~ 21:00', content: '운동', isDone: false, isUseAlarm: false },
  // ];

  const [toDoList, setToDoList] = useState([]);
  const [memo, setMemo] = useState("");
  const [dateLabel, setDateLabel] = useState("");

  const { dateKey } = useParams();

  let selectedDate;

  if (dateKey) {
    selectedDate = {
      year: "20" + dateKey.slice(0,2),
      month: dateKey.slice(2,4),
      day: dateKey.slice(4,6),
    };
  } else {
    const now = new Date();
    selectedDate = {
      year: now.getFullYear(),
      month: String(now.getMonth()+1).padStart(2,"0"),
      day: String(now.getDate()).padStart(2,"0")
    };
  }

  useEffect(() => {
    const fetchDate = async () => {
      try {
        const url = dateKey ? `/plan/${dateKey}` : "/plan/today"
        const token = localStorage.getItem("token");
        const res = await fetch(process.env.REACT_APP_API_BASE_URL + url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        setToDoList(data.toDoList ?? []);
        setMemo(data.memo ?? "");

        const { year, month, day } = data.date ?? {};
        if (year && month && day) { 
          if(dateKey) setDateLabel(`${year}년 ${month}월 ${day}일`);
          else setDateLabel("Today");
        }
      } catch (e) {
        console.error("일정 조회 실패:", e);
      }
    };

    fetchDate();
  }, []);

  return (
    <div className="date-container">
      <div className="planner-header">
        <h1 className="date-content">{dateLabel}</h1>
        <span className="material-symbols-outlined doc-icon">description</span>
      </div>

      <div className="toDo-list">
        {toDoList.map((toDo) => (
          <div key={toDo.toDoId} className="toDo-detail">
            <div className="toDo-content">
              <span className="toDo-time">{toDo.time}</span>
              <div className="content-row">
                <span className="toDo-content">{toDo.content}</span>
                {toDo.isUseAlarm && <span className="material-symbols-outlined notif-icon">notifications</span>}
              </div>
            </div>
            <div className="toDo-checkbox">
              {toDo.isDone ? (
                <span className="material-symbols-outlined check-icon active">select_check_box</span>
              ) : (
                <span className="material-symbols-outlined check-icon">check_box_outline_blank</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatePlan;