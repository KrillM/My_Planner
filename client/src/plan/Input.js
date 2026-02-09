import { useState } from "react";
import "../styles/input.scss";
import '../styles/save.scss';

const Input = () => {
  const [slot, setSlot] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [content, setContent] = useState("");
  const [timeSlotType, setTimeSlotType] = useState("slot");
  const [isUseTimeSlot, setIsUseTimeSlot] = useState(true);
  const [isContentEmpty, setIsContentEmpty] = useState(false);
  const [isWrongTimeSlot, setIsWrongTimeSlot] = useState(false);

  const resetTodo = () => {
    setSlot("slot")
    setStart("");
    setEnd("");
    setContent("");
  }

  const setEndTimeDefault = (start) => {
    if(!start) return "";

    const [hour, minute] = start.split(":").map(Number);
    let endTime = hour * 60 + minute + 60;
    endTime %= 24 * 60;

    const setHour = String(Math.floor(endTime / 60)).padStart(2, "0");
    const setMinutes = String(endTime % 60).padStart(2, "0");
    return `${setHour}:${setMinutes}`
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const contentEmpty = content.trim() === "";
    const wrongTimeSlot = (isUseTimeSlot === true && (start > end))

    setIsContentEmpty(contentEmpty);
    setIsWrongTimeSlot(wrongTimeSlot);

    if(contentEmpty || wrongTimeSlot) return;
  }

  return (
    <form className="input-wrap" onSubmit={handleSubmit}>
      <div className="slot-row">     
        <select
          name="timeSlotType"
          id="timeSlotType"
          className="pill pill-label"
          value={timeSlotType}
          onChange={(e) => {
            const val = e.target.value;
            setTimeSlotType(val);
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
        <>
          <input
            className="pill pill-time"
            type="time"
            value={start}
            onChange={(e) => {
              const setEndTime = e.target.value;
              setStart(setEndTime);
              setEnd(setEndTimeDefault(setEndTime))
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
        </>
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

      <input
        className="content-input"
        value={content}
        placeholder="To Do"
        onChange={(e)=>inputToDo(e.target.value)}
      />

      {isContentEmpty && (
        <p className="warning-message">
          계획을 입력해주세요.
        </p>
      )}

      {isWrongTimeSlot && (
        <p className="warning-message">
          종료시간은 시작시간보다 빠를 수 없습니다.
        </p>
      )}
      
      <button type="submit" className="save-btn">SAVE</button>
      <button type="submit" className="temp-btn">TEMP</button>
    </form>
  );
}

export default Input;