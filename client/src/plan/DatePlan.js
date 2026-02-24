import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ModalMemoRead from "../modals/ModalMemoRead";
import UpdateIcon from "../upsert/UpdateIcon";
import '../styles/date.scss';

const DatePlan = () => {
  const navigate = useNavigate();
  const { dateKey } = useParams();

  const [toDoList, setToDoList] = useState([]);
  const [memo, setMemo] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [isDateExist, setIsDateExist] = useState(false);
  const [isTemporary, setIsTemporary] = useState("N");

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
        setIsTemporary(data.isTemporary ?? "N");

        if((data.toDoList ?? []).length > 0) setIsDateExist(true);
        else setIsDateExist(false);
        
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

  // 메모 useState
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const openMemoModal = () => setIsMemoModalOpen(true);
  const handleCloseMemoModal = () => {
    setIsMemoModalOpen(false);
  };

  const getTodayKey = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yy}${mm}${dd}`;
  };

  // 일정 작성 || 수정 페이지 이동
  const move = () => {
    if(isDateExist) {
      if(!dateKey) navigate(`/upsert/${getTodayKey()}`);
      else navigate(`/upsert/${dateKey}`);
    }
    else {
      navigate("/new");
    }
  }

  // toDo 업데이트
  const todoToggle = async (toDoId) => {

    const token = localStorage.getItem("token");
    const current = toDoList.find(t => t.toDoId === toDoId);
    if (!current) return;

    const nextValue = !current.isDone;

    setToDoList(prev =>
      prev.map(t =>
        t.toDoId === toDoId
          ? { ...t, isDone: nextValue }
          : t
      )
    );

    try {
      const res = await fetch(
        process.env.REACT_APP_API_BASE_URL + `/plan/${toDoId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("server error");
    } catch (e) {
      console.error("체크 토글 실패", e);
      setToDoList(prev =>
        prev.map(t =>
          t.toDoId === toDoId
            ? { ...t, isDone: !nextValue }
            : t
        )
      );
    }
  };

  // 메모 수정
  const handleMemoSave = async (html) => {
    setMemo(html);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + `/memo/${dateKey}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memo: html }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);
    } catch (e) {
      console.error(e);
      alert("메모 저장에 실패했습니다.");
    }
  };

  return (
    <div className="date-container">
      <div className="planner-header">
        <h1 className="date-content">{dateLabel}</h1>
        {toDoList.length > 0 && (
          <span
            className="material-symbols-outlined doc-icon"
            onClick={openMemoModal}
          >
            description
          </span>
        )}
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
            {isTemporary === "N" && (
              <div className="toDo-checkbox">
                <span
                  className={`material-symbols-outlined check-icon ${toDo.isDone ? "active" : ""}`}
                  onClick={() => todoToggle(toDo.toDoId)}
                >
                  {toDo.isDone ? "select_check_box" : "check_box_outline_blank"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <ModalMemoRead
        open={isMemoModalOpen}
        close={handleCloseMemoModal}
        memo={memo}
        onSave={handleMemoSave}
      />
      <UpdateIcon onClick={move}/>
    </div>
  );
};

export default DatePlan;