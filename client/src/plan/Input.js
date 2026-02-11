  import { useState, useEffect } from "react";
  import "../styles/input.scss";
  import '../styles/save.scss';

  const Input = ({ addTodo }) => {
    const [slot, setSlot] = useState("slot");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [content, setContent] = useState("");
    const [isUseTimeSlot, setIsUseTimeSlot] = useState(true);
    const [isContentEmpty, setIsContentEmpty] = useState(false);
    const [isWrongTimeSlot, setIsWrongTimeSlot] = useState(false);
    const [isTimeEmpty, setIsTimeEmpty] = useState(false);
    const [isUseAlarm, setIsUseAlarm] = useState(false);

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

    // const setEndTimeDefault = (start) => {
    //   if(!start) return "";

    //   const [hour, minute] = start.split(":").map(Number);
    //   let endTime = hour * 60 + minute + 60;
    //   endTime %= 24 * 60;

    //   const setHour = String(Math.floor(endTime / 60)).padStart(2, "0");
    //   const setMinutes = String(endTime % 60).padStart(2, "0");
    //   return `${setHour}:${setMinutes}`
    // }

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
          <select
            name="timeSlotType"
            id="timeSlotType"
            className="pill pill-label"
            value={slot}
            onChange={(e) => {
              const val = e.target.value;
              setSlot(val);
              setIsUseTimeSlot(val === "slot");
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
                const setEndTime = e.target.value;
                setStart(setEndTime);
                // setEnd(setEndTimeDefault(setEndTime))
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
            <button type="submit" className="icon-btn add" aria-label="addTodo">
              <span className="material-symbols-outlined">edit</span>
            </button>
          </div>
        </div>

        {isContentEmpty && (
          <p className="warning-message">
            계획을 입력해주세요.
          </p>
        )}

        {(isWrongTimeSlot && isUseTimeSlot) && (
          <p className="warning-message">
            종료시간은 시작시간보다 빠를 수 없습니다.
          </p>
        )}

        {(isTimeEmpty && isUseTimeSlot) && (
          <p className="warning-message">
            시작 시간을 입력해주세요.
          </p>
        )}
      </form>
    );
  }

  export default Input;