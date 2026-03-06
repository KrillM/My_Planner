import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import InputTodo from "../upsert/InputTodo";
import ModalMemoUpsert from "../modals/ModalMemoUpsert";
import UpdateTodo from "../upsert/UpdateTodo";
import ModalMessage from '../modals/ModalMessage';
import ModalCheck from "../modals/ModalCheck";
import CalendarPopover from "../calendar/CalendarPopover";
import { buildTodoTime, applyTodoUpdate } from "./PlanUtils";
import { PLAN_TIME_SLOT_OPTIONS } from "../upsert/TimeSlotUtils";
import "../styles/date.scss";

const UpsertPlan = () => {
  const { dateKey } = useParams();

  useEffect(() => {
    if (!dateKey) return;

    const fetchExisting = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          process.env.REACT_APP_API_BASE_URL + `/plan/${dateKey}?mode=edit`,
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
        setEventList(data.eventList ?? []);
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

  const tempTodoIdRef = useRef(-1);
  const tempEventIdRef = useRef(-1);

  const handleAddTodo = ({ slot, start, end, content, isUseAlarm }) => {

    // EventList
    if (slot === "allday") {
      const newEvent = {
        eventId: null,
        tempId: tempEventIdRef.current--, // 프론트용 임시키
        content,
      };

      setEventList((prev) => [...prev, newEvent]);
      setIsTodoListNull(false); // 메시지 재사용하면 그대로 둬도 됨
      return;
    }

    // ToDoList
    const time = buildTodoTime({slot, start, end})

    const newTodo = {
      toDoId: null,
      tempId: tempTodoIdRef.current--,
      time,
      content,
      isUseAlarm,
      isDone: "N"
    };

    setToDoList((prev) => [...prev, newTodo]);
    setIsTodoListNull(false);
  };

  const getToDoKey = (t) => t.toDoId ?? t.tempId;
  const getEventKey = (e) => e.eventId ?? e.tempId;

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
    const k = getToDoKey(todo);
    setSelectedTodoID(prev => (prev === k ? null : k));
    setIsUpdateInputOpen(true);
  }

  const updateTodo = (payload) => {
    if (payload.slot === "allday") {
      setToDoList(prev => prev.filter(t => getToDoKey(t) !== payload.key));

      setEventList(prev => [
        ...prev,
        { eventId: payload.key, content: payload.content } // eventId는 임시로 key 써도 됨
      ]);

      setSelectedTodoID(null);
      setIsUpdateInputOpen(false);
      setIsButtonClickedWhenUpdateInputButtonOpen(false);
      return;
    }

    setToDoList((prev) => applyTodoUpdate(prev, getToDoKey, payload));
    setSelectedTodoID(null);
    setIsUpdateInputOpen(false);
    setIsButtonClickedWhenUpdateInputButtonOpen(false); 
  };

  // toDo 삭제
  const removeTodo = (todo) => {
    const k = getToDoKey(todo);
    setToDoList(prev => prev.filter(t => getToDoKey(t) !== k));
  }

  // 디데이 사용 여부
  const [isUseDDay, setIsUseDDay] = useState(false);

  // 임시 저장 여부
  const submitTempRef = useRef("N");

  // 달력 
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const selectedKey = year && month && day ? `${year}-${month}-${day}` : "";

  // 이벤트
  const [eventList, setEventList] = useState([]);
  const [selectedEventID, setSelectedEventID] = useState(null);

  const showUpdateEvent = (event) => {
    setSelectedEventID(getEventKey(event));
    setIsUpdateInputOpen(true);
  };

  const updateEvent = (payload) => {
    if (payload.slot !== "allday") {
      setEventList(prev => prev.filter(e => e.eventId !== payload.key));

      const time = buildTodoTime({ slot: payload.slot, start: payload.start, end: payload.end });

      setToDoList(prev => [
        ...prev,
        {
          toDoId: null,
          tempId: tempTodoIdRef.current--,
          time,
          content: payload.content,
          isUseAlarm: payload.isUseAlarm,
          isDone: "N",
          slot: payload.slot
        }
      ]);

      setSelectedEventID(null);
      setIsUpdateInputOpen(false);
      setIsButtonClickedWhenUpdateInputButtonOpen(false);
      return;
    }

    setEventList(prev =>
      prev.map(e => (e.eventId === payload.key ? { ...e, content: payload.content } : e))
    );

    setSelectedEventID(null);
    setIsUpdateInputOpen(false);
    setIsButtonClickedWhenUpdateInputButtonOpen(false);
  };

  const removeEvent = (event) => {
    const k = getEventKey(event);
    setEventList(prev => prev.filter(e => getEventKey(e) !== k));
  }
      
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

    const addPlan = {year, month, day, isTemporary: isTemp, isUseDDay, toDoList, eventList, memo};

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
    
    if(isDeleteSuccess){
      navigate("/", { replace: true });
    }
    else if (resultMessage ===  "이미 해당 날짜에 일정이 존재합니다."){
      return;
    }
    else {
      const yy = String(year).slice(-2);
      const mm = String(month).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      
      navigate(`/${yy}${mm}${dd}`, { replace: true });
    }
  };

  // 경고 모달 창
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [isDeleteSuccess, setIsDeleteSuccess] = useState(false);
  const openCheckModal = () => setIsCheckModalOpen(true);
  const closeCheckModal = () => setIsCheckModalOpen(false);

  const deleteMessage = (
    <>
      일정을 삭제하시겠습니까?
      <br />
      이 작업은 되돌릴 수 없습니다.
    </>
  );

  const handleDelete = async () => {
    try{
      const token = localStorage.getItem("token");
      const res = await fetch(
        process.env.REACT_APP_API_BASE_URL + `/plan/delete/${dateKey}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },   
        }
      );
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { result: res.ok, message: text };
      }

      const ok = !!data.result && res.ok;
      setIsDeleteSuccess(ok);
      setResultMessage( data.message );
    }
    catch(err){
      setIsDeleteSuccess(false);
      setResultMessage("네트워크 오류로 일정 삭제하지 못했습니다.");
    }
    closeCheckModal();
    setIsResultModalOpen(true);
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
            className={`set-toggle ${isUseDDay ? "toggle-d-day-on" : "toggle-d-day-off"}`}
            onClick={() => setIsUseDDay(prev => !prev)}
          >
            { isUseDDay ? (
              <span className="material-symbols-outlined">toggle_on</span>) : (
              <span className="material-symbols-outlined">toggle_off</span>
            )}
            D-Day
          </div>
        </div>
        <div className="doc-icon">
          <div className="cal-anchor">
            <span
              className={`material-symbols-outlined ${isDateEmpty ? "icon-error" : ""}`}
              onClick={() => setIsCalendarOpen((v) => !v)}
            >
              calendar_month
            </span>

            {isCalendarOpen && (
              <div className="cal-popover">
                <CalendarPopover
                  selectedKey={selectedKey}
                  canSelect={({ isOutMonth, info }) => !isOutMonth && !info.hasPlan}
                  onSelectDate={(d) => {
                    const y = String(d.getFullYear());
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");

                    setYear(y);
                    setMonth(m);
                    setDay(dd);
                    setDateSet(`${y}년 ${m}월 ${dd}일`);
                    setIsDateEmpty(false);
                    setIsCalendarOpen(false);
                  }}
                  onClose={() => setIsCalendarOpen(false)}
                />
              </div>
            )}
          </div>
          <span className="material-symbols-outlined" onClick={openMemoModal}>description</span>
          <span className="material-symbols-outlined" onClick={openCheckModal}>delete</span>
        </div>
      </div>

      <div className="toDo-list">
        {eventList.map((event) => {
          const eKey = getEventKey(event);

          return(
            <div key={`event-${eKey}`}>
              {selectedEventID === eKey ? (
                <UpdateTodo
                  todo={{
                    content: event.content,
                    time: "Event", 
                    isUseAlarm: false
                  }}
                  todoKey={event.eventId}
                  updateTodo={updateEvent}
                  onCancel={() => {
                    setSelectedEventID(null);
                    setIsUpdateInputOpen(false);
                  }}
                  timeSlotOptions={PLAN_TIME_SLOT_OPTIONS}
                />
              ) : (
                <div className="toDo-detail">
                  <div className="toDo-content">
                    <span className="toDo-time">Event</span>
                    <div className="content-row">
                      <span className="toDo-content">{event.content}</span>
                    </div>
                  </div>

                  <div className="toDo-checkbox">
                    <span
                      className="material-symbols-outlined toDo-checkbox-detail"
                      onClick={() => showUpdateEvent(event)}
                    >
                      edit
                    </span>
                    <span 
                      className="material-symbols-outlined toDo-checkbox-detail"
                      onClick={() => removeEvent(event)}
                    >
                      delete
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {toDoList.map((toDo) => (
          <div key={getToDoKey(toDo)}>
            {selectedTodoID === getToDoKey(toDo) ? (
              <UpdateTodo
                todo={toDo}
                todoKey={getToDoKey(toDo)}
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
                    onClick={() => removeTodo(toDo)}
                  >
                    delete
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <InputTodo addTodo={handleAddTodo} timeSlotOptions={PLAN_TIME_SLOT_OPTIONS}/>

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
      <ModalCheck open={isCheckModalOpen} onClose={closeCheckModal} onConfirm={handleDelete} message={deleteMessage} btnMsg={`Delete`}/>
    </div>
  );
};

export default UpsertPlan;