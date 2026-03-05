  import { useState, useEffect } from "react";
  import { SelectTimeSlot } from "./SelectTimeSlot";
  import "../styles/input.scss";
  import '../styles/save.scss';

  const InputTodo = ({ addTodo }) => {
    const [slot, setSlot] = useState("slot");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [content, setContent] = useState("");
    const [isUseTimeSlot, setIsUseTimeSlot] = useState(true);
    const [isContentEmpty, setIsContentEmpty] = useState(false);
    const [isWrongTimeSlot, setIsWrongTimeSlot] = useState(false);
    const [isTimeEmpty, setIsTimeEmpty] = useState(false);
    const [isUseAlarm, setIsUseAlarm] = useState(false);
    const isAllDay = slot === "allday";

    const resetTodo = () => {
      setSlot("slot");
      setIsUseTimeSlot(true);
      setStart("");
      setEnd("");
      setContent("");
      setIsContentEmpty(false);
      setIsWrongTimeSlot(false);
      setIsTimeEmpty(false);
    }

    const setTime = (start) => {
      if(start !== "") setIsTimeEmpty(false);
    }

    // toDo 입력
    const inputToDo = (value) => {
      setContent(value);

      if(isContentEmpty){
        if(value.trim()!==''){
          setIsContentEmpty(false);
        }
      }
    }

    useEffect(() => {
      setIsWrongTimeSlot(
        start && end ? start > end : false
      );
    }, [start, end]);

    const handleSubmit = async (e) => {
      e.preventDefault();

      const contentEmpty = content.trim() === "";
      const wrongTimeSlot = (isUseTimeSlot === true && end !== "" && (start > end));
      const timeEmpty = (slot === "slot" && start === "");

      setIsContentEmpty(contentEmpty);
      setIsWrongTimeSlot(wrongTimeSlot);
      setIsTimeEmpty(timeEmpty);

      if(contentEmpty || wrongTimeSlot || timeEmpty) return;

      // 여기서 부모(New)의 리스트에 추가
      addTodo?.({ slot, start, end, content: content.trim(), isUseAlarm });

      // 입력창 초기화
      resetTodo();
    }

    return (
      <form className="input-wrap" onSubmit={handleSubmit}>
        <div className="slot-row">     
          <SelectTimeSlot
            slot={slot}
            onChange={(val) => {
              setSlot(val);
              setIsUseTimeSlot(val === "slot");

              if (val === "allday") {
                setIsUseAlarm(false);
              }

              if (val !== "slot") {
                setStart("");
                setEnd("");
              }
            }}
          />
          {isUseTimeSlot && (
          <div className="time-group">
            <input
              className="pill pill-time"
              type="time"
              value={start}
              onChange={(e) => {
                const setEndTime = e.target.value;
                setStart(setEndTime);
                setTime(setEndTime)
              }}
            />

            <span className="tilde">~</span>

            <input
              className="pill pill-time"
              type="time"
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
              }}
            />
          </div>
          )}

          <button
            type="button"
            className="close-btn"
            aria-label="close"
            onClick={() => resetTodo()}
          >
            ×
          </button>
        </div>

        <div className="content-row">
          <input
            className="content-input"
            value={content}
            placeholder="To Do"
            onChange={(e) => inputToDo(e.target.value)}
          />

          <div className="content-icons">
            {!isAllDay && (
              <button
                type="button"
                className={`icon-btn alert ${isUseAlarm ? "active" : ""}`}
                aria-label="setAlert"
                onClick={() => setIsUseAlarm(prev => !prev)}
              >
                <span className="material-symbols-outlined">
                  add_alert
                </span>
              </button>
            )}
            <button type="submit" className="icon-btn add" aria-label="addTodo">
              <span className="material-symbols-outlined">edit</span>
            </button>
          </div>
        </div>

        {isContentEmpty && <p className="warning-message">계획을 입력해주세요.</p>}
        {(isWrongTimeSlot && isUseTimeSlot) && <p className="warning-message">종료시간은 시작시간보다 빠를 수 없습니다.</p>}
        {(isTimeEmpty && isUseTimeSlot) && <p className="warning-message">시작 시간을 입력해주세요.</p>}
      </form>
    );
  }

  export default InputTodo;