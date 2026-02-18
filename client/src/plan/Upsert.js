import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import InputTodo from "./InputTodo";
import ModalMemoUpsert from "../modals/ModalMemoUpsert";
import UpdateTodo from "./UpdateTodo";
import ModalMessage from '../modals/ModalMessage';
import ModalCheck from "../modals/ModalCheck";
import "../styles/date.scss";

const Upsert = () => {

  const { dateKey } = useParams();

  useEffect(() => {
    if (!dateKey) return;

    const fetchExisting = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          process.env.REACT_APP_API_BASE_URL + `/plan/editpage/${dateKey}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            if (res.status === 404) {
            navigate("/404", { replace: true });
            return;
            }
            throw new Error(errData.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        
        const { year, month, day } = data.date ?? {};
        if (year && month && day) {
            setYear(String(year));
            setMonth(String(month).padStart(2, "0"));
            setDay(String(day).padStart(2, "0"));
            setDateSet(`${year}년 ${String(month).padStart(2, "0")}월 ${String(day).padStart(2, "0")}일`);
        }

        setToDoList(data.toDoList ?? []);
        setMemo(data.memo ?? "");
        setIsUseDDay(data.isUseDDay === "Y");
      } catch (e) {
        console.error("기존 일정 조회 실패:", e);
      }
    };

    if (dateKey) fetchExisting();
  }, [dateKey]);

  const navigate = useNavigate();
  
  const [toDoList, setToDoList] = useState([]);
  const [isTodoListNull, setIsTodoListNull] = useState(false);
  const [isUpdateInputOpen, setIsUpdateInputOpen] = useState(false);
  const [isButtonClickedWhenUpdateInputButtonOpen, setIsButtonClickedWhenUpdateInputButtonOpen] = useState(false);

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
    setIsTodoListNull(false);
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
  };

  const calendarRef = useRef(null);

  // 날짜 설정
  const isDateNotSet = "날짜를 달력에서 선택하세요.";
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [dateSet, setDateSet] = useState(isDateNotSet);
  const [isDateEmpty, setIsDateEmpty] = useState(false);

  // 일정 수정
  const [selectedTodoID, setSelectedTodoID] = useState(null);

  const showUpdateTodo = (todo) => {
    setSelectedTodoID(prev =>
      prev === todo.toDoId ? null : todo.toDoId
    );

    setIsUpdateInputOpen(true);
  }

  const updateTodo = ({ toDoId, slot, start, end, content, isUseAlarm }) => {
    const time =
      slot === "slot"
        ? `${start}${end ? ` ~ ${end}` : ""}`
        : slot === "morning" ? "오전"
        : slot === "afternoon" ? "오후"
        : slot === "evening" ? "저녁"
        : "밤";

    setToDoList(prev =>
      prev.map(t =>
        t.toDoId === toDoId
          ? { ...t, time, content, isUseAlarm, slot }
          : t
      )
    );

    setSelectedTodoID(null);
    setIsUpdateInputOpen(false);
    setIsButtonClickedWhenUpdateInputButtonOpen(false); 
  };

  // toDo 삭제
  const removeTodo = (todoId) => {
    setToDoList(prev =>
      prev.filter(t => t.toDoId !== todoId)
    );
  }

  // 디데이 사용 여부
  const [isUseDDay, setIsUseDDay] = useState(false);

  // 임시 저장 여부
  const submitTempRef = useRef("N");
  
  // 저장
  const handleSubmit = async (isTemp) => {
    submitTempRef.current = isTemp;

    if(dateSet === isDateNotSet){
      setIsDateEmpty(true);
      return;
    }

    if(toDoList.length === 0){
      setIsTodoListNull(true);
      return;
    }

    if(isUpdateInputOpen){
      setIsButtonClickedWhenUpdateInputButtonOpen(true);
      return;
    }

    const addPlan = {year, month, day, isTemporary: isTemp, isUseDDay, toDoList, memo};

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + `/plan/upsert/${dateKey}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addPlan),
      });

      const data = await res.json();
      console.log("서버 응답:", data);

      setResultMessage(data.message);
      setIsResultModalOpen(true);
    } catch (err) {
      console.error("전송 실패:", err);
    }
  }

  // 메시지 모달 창
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const handleResultConfirm = () => {
    setIsResultModalOpen(false);
    if(submitTempRef.current === "Y") {
      navigate("/", { replace: true });
      return;
    }
    const yy = String(year).slice(-2);
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    
    navigate(`/${yy}${mm}${dd}`, { replace: true });
  };

  // 경고 모달 창
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const openCheckModal = () => setIsCheckModalOpen(true);
  const closeCheckModal = () => setIsCheckModalOpen(false);

  const deleteMessage = (
    <>
      일정을 삭제하시겠습니까?
      <br />
      이 작업은 되돌릴 수 없습니다.
    </>
  );

  const handleDelete = () => {

  }

  return (
    <div className="date-container">
      <div className="planner-header">
        <div className="date-content">
          <input
            className={`date-detail ${isDateEmpty ? "icon-error" : ""}`}
            type="text"
            name="date"
            value={dateSet}
            readOnly
          />
          <div 
            className="set-toggle" 
            onClick={() => setIsUseDDay(prev => !prev)}
            style={{
              cursor: "pointer",
              color: isUseDDay ? "#4caf50" : "#bbb"
            }}>
            { isUseDDay ? (
              <span className="material-symbols-outlined">toggle_on</span>) : (
              <span className="material-symbols-outlined">toggle_off</span>
            )}
            D-Day
          </div>
        </div>
        <div className="doc-icon">
          <input 
            ref={calendarRef} 
            type="date" 
            name="date" 
            className="hidden-date" 
            onChange={(e) => {
            const value = e.target.value;
            if (!value) return;
            const [y, m, d] = value.split("-");
            setYear(y);
            setMonth(m);
            setDay(d);
            setDateSet(y+"년 "+m+"월 "+d+"일");
            setIsDateEmpty(false);
          }}
          />
          <span
            className={`material-symbols-outlined ${isDateEmpty ? "icon-error" : ""}`}
            onClick={() => calendarRef.current?.showPicker()}
          >
            calendar_month
          </span>
          <span className="material-symbols-outlined" onClick={openMemoModal}>description</span>
          <span className="material-symbols-outlined" onClick={openCheckModal}>delete</span>
        </div>
      </div>

      <div className="toDo-list">
        {toDoList.map((toDo) => (
          <div key={toDo.toDoId}>
            {selectedTodoID === toDo.toDoId ? (
              <UpdateTodo
                todo={toDo}
                updateTodo={updateTodo}
                onCancel={() => {
                  setSelectedTodoID(null);
                  setIsUpdateInputOpen(false);
                }}
              />
            ) : (
              <div className="toDo-detail">
                <div className="toDo-content">
                  <span className="toDo-time">{toDo.time}</span>
                  <div className="content-row">
                    <span className="toDo-content">{toDo.content}</span>
                    {toDo.isUseAlarm && <span className="material-symbols-outlined notif-icon">notifications</span>}
                  </div>
                </div>

                <div className="toDo-checkbox">
                  <span
                    className="material-symbols-outlined toDo-checkbox-detail"
                    onClick={() => showUpdateTodo(toDo)}
                  >
                    edit
                  </span>
                  <span 
                    className="material-symbols-outlined toDo-checkbox-detail"
                    onClick={() => removeTodo(toDo.toDoId)}
                  >
                    delete
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <InputTodo addTodo={handleAddTodo}/>

      {isTodoListNull && (
        <p className="warning-message">
          일정이 존재하지 않습니다. 일정을 등록해주세요.
        </p>
      )}

      {(isUpdateInputOpen && isButtonClickedWhenUpdateInputButtonOpen ) && (
        <p className="warning-message">
          수정 중인 일정이 있으면 저장할 수 없습니다.
        </p>
      )}

      <button type="submit" className="save-btn" onClick={()=>handleSubmit("N")}>SAVE</button>
      <button type="submit" className="temp-btn" onClick={()=>handleSubmit("Y")}>TEMP</button>

      <ModalMemoUpsert open={isMemoModalOpen} onConfirm={handleCloseMemoModal} onSave={handleSaveMemo} memo={memo}/>
      <ModalMessage open={isResultModalOpen} message={resultMessage} onConfirm={handleResultConfirm} />
      <ModalCheck open={isCheckModalOpen} onClose={closeCheckModal} onConfirm={handleDelete} message={deleteMessage}/>
    </div>
  );
};

export default Upsert;