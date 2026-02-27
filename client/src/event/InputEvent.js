import { useState, useEffect } from "react";
import CalendarEventPopover from "../calendar/CalendarEventPopover";
import ModalMessage from "../modals/ModalMessage";
import "../styles/input.scss";
import '../styles/save.scss';

const InputEvent = ({onCancel, onSaved}) => {
    const [slot, setSlot] = useState("period");
    const [repeat, setRepeat] = useState("none");
    const [dateBegin, setDateBegin] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [content, setContent] = useState("");
    const [isUseTimeSlot, setIsUseTimeSlot] = useState(true);
    const [isUseDDay, setIsUseDDay] = useState(false);
    
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calTarget, setCalTarget] = useState(null);
    
    const [isContentEmpty, setIsContentEmpty] = useState(false);
    const [isWrongTimeSlot, setIsWrongTimeSlot] = useState(false);
    const [isDateEmpty, setIsDateEmpty] = useState(false);

    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [resultMessage, setResultMessage] = useState("");
    
    const validateContent = (value)=> {
        setContent(value);

        if(isContentEmpty){
            if(value.trim()!=='') setIsContentEmpty(false);
        }
    } 

    const resetEvent = () => {
        setSlot("period");
        setRepeat("none");
        setIsUseTimeSlot(true);
        setDateBegin("");
        setDateEnd("");
        setContent("");
        setIsContentEmpty(false);
        setIsWrongTimeSlot(false);
        setIsDateEmpty(false);
    }

    const setDate = (dateBegin) => {
        if(dateBegin !== "") setIsDateEmpty(false);
    }

    useEffect(() => {
        setIsWrongTimeSlot(
            dateBegin && dateEnd ? dateBegin > dateEnd : false
        );
    }, [dateBegin, dateEnd]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const contentEmpty = content.trim() === "";
        const wrongTimeSlot = (isUseTimeSlot === true && dateEnd !== "" && (dateBegin > dateEnd));
        const timeEmpty = (slot === "period" && dateBegin === "");

        setIsContentEmpty(contentEmpty);
        setIsWrongTimeSlot(wrongTimeSlot);
        setIsDateEmpty(timeEmpty);

        if(contentEmpty || wrongTimeSlot || timeEmpty) return;
        if(dateEnd === "") setDateEnd(dateBegin);

        const addEvent = {content, dateBegin, dateEnd, isUseDDay, repeat};

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/event/new", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(addEvent),
            });

            const data = await res.json();
            console.log("서버 응답:", data);

            setResultMessage(data.message);
            setIsResultModalOpen(true);
            if (res.ok) onSaved?.();
        } catch (err) {
            console.error("전송 실패:", err);
        }
    }

    const handleResultConfirm = () => {
        setIsResultModalOpen(false);
        resetEvent();
        onCancel?.(); 
    };

    return (
        <form className="input-wrap" onSubmit={handleSubmit}>
            <div className="slot-row">     
                <select
                    name="timeSlotType"
                    id="timeSlotType"
                    className="pill pill-event"
                    value={slot}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSlot(val);
                        setIsUseTimeSlot(val === "period");
                    }}
                >
                    <option value="period">Period</option>
                    <option value="singleDay">Single Day</option>
                </select>

                <select
                    className="pill pill-event"
                    value={repeat}
                    onChange={(e) => {setRepeat(e.target.value)}}
                >
                    <option value="none">No Repeat</option>
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                </select>

                <div className="time-group">
                    <div className="pill-wrapper">
                        <input
                            className="pill pill-time"
                            type="text"
                            value={dateBegin}
                            onChange={(e) => {
                                const setDateEndTime = e.target.value;
                                setDateBegin(setDateEndTime);
                                setDate(setDateEndTime)
                            }}
                            readOnly
                        />
                        <span 
                            className="material-symbols-outlined"
                            onClick={() => { setCalTarget("begin"); setIsCalendarOpen(true); }}
                        >
                            calendar_month
                        </span>
                    </div>
                    {isUseTimeSlot && (
                        <>
                        <span className="tilde">~</span>

                        <div className="pill-wrapper">
                            <input
                                className="pill pill-time"
                                type="text"
                                value={dateEnd}
                                onChange={(e) => {
                                    setDateEnd(e.target.value);
                                }}
                                readOnly
                            />
                            <span 
                                className="material-symbols-outlined"
                                onClick={() => { setCalTarget("end"); setIsCalendarOpen(true); }}
                            >
                                calendar_month
                            </span>
                        </div>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="close-btn"
                    aria-label="close"
                    onClick={onCancel}
                >
                    ×
                </button>
            </div>

            <div className="content-row">
                <input
                    className="content-input"
                    value={content}
                    placeholder="Event"
                    onChange={(e)=>validateContent(e.target.value)}
                />

                <div className="event-icons">
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
                    <button type="submit" className="icon-btn add" aria-label="addTodo" onClick={handleSubmit}>
                        <span className="material-symbols-outlined">edit</span>
                    </button>
                </div>
            </div>

            {isContentEmpty && (<p className="warning-message">이벤트 입력해주세요.</p>)}
            {(isWrongTimeSlot && isUseTimeSlot) && (<p className="warning-message">종료날짜는 시작날짜보다 빠를 수 없습니다.</p>)}
            {(isDateEmpty && isUseTimeSlot) && (<p className="warning-message">날짜를 입력해주세요.</p>)}

            {isCalendarOpen && (
                <div className="cal-modal-overlay" onClick={() => setIsCalendarOpen(false)}>
                    <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
                    <CalendarEventPopover
                        onSelectDate={(d) => {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, "0");
                            const dd = String(d.getDate()).padStart(2, "0");
                            const ymd = `${y}-${m}-${dd}`;

                            if (calTarget === "begin") {
                                setDateBegin(ymd);
                                setDate(ymd);
                            } else {
                                setDateEnd(ymd);
                            }

                            setIsCalendarOpen(false);
                        }}
                        canSelect={() => true}
                        onClose={() => setIsCalendarOpen(false)}
                    />
                    </div>
                </div>
            )}

            <ModalMessage open={isResultModalOpen} message={resultMessage} onConfirm={handleResultConfirm} />
        </form>
    );
  }

  export default InputEvent;