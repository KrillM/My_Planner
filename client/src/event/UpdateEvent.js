import { useState, useEffect } from "react";
import CalendarEventPopover from "../calendar/CalendarEventPopover";
import ModalMessage from "../modals/ModalMessage";
import ModalCheck from "../modals/ModalCheck";
import "../styles/input.scss";
import '../styles/save.scss';

const UpdateEvent = ({eventId, event, onCancel, onSaved}) => {
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

    const [shouldCloseAfterModal, setShouldCloseAfterModal] = useState(false);
    const [shouldRefreshAfterModal, setShouldRefreshAfterModal] = useState(false);
    
    const validateContent = (value)=> {
        setContent(value);

        if(isContentEmpty){
            if(value.trim()!=='') setIsContentEmpty(false);
        }
    } 

    const setDate = (dateBegin) => {
        if(dateBegin !== "") setIsDateEmpty(false);
    }

    useEffect(() => {
        setIsWrongTimeSlot(
            dateBegin && dateEnd ? dateBegin > dateEnd : false
        );
    }, [dateBegin, dateEnd]);

    useEffect(() => {
        if (!event) return;

        // 서버 키가 snake_case일 가능성도 있으니 둘 다 커버
        const contentVal = event.content ?? "";
        const repeatVal = event.repeat ?? "none";

        const begin = String(event.dateBegin ?? event.date_begin ?? "").slice(0, 10);
        const end = String(event.dateEnd ?? event.date_end ?? "").slice(0, 10);

        setContent(contentVal);
        setRepeat(repeatVal);

        setDateBegin(begin);
        setDateEnd(end || begin);

        const useDDay = (event.isUseDDay ?? event.isUsedDay ?? event.is_use_dday) === "Y";
        setIsUseDDay(useDDay);

        // begin!=end면 period, 같으면 singleDay
        const isPeriod = begin && end && begin !== end;
        setSlot(isPeriod ? "period" : "singleDay");
        setIsUseTimeSlot(isPeriod);
    }, [event]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const contentEmpty = content.trim() === "";
        const wrongTimeSlot = (isUseTimeSlot === true && dateEnd !== "" && (dateBegin > dateEnd));
        const timeEmpty = (slot === "period" && dateBegin === "");

        setIsContentEmpty(contentEmpty);
        setIsWrongTimeSlot(wrongTimeSlot);
        setIsDateEmpty(timeEmpty);

        if(contentEmpty || wrongTimeSlot || timeEmpty) return;
        const finalDateEnd = dateEnd?.trim() ? dateEnd : dateBegin;

        
        const upsertEvent = {
            content,
            dateBegin,
            dateEnd: finalDateEnd,
            isUseDDay,
            repeat,
        };

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(process.env.REACT_APP_API_BASE_URL + `/event/upsert/${eventId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(upsertEvent),
            });

            const data = await res.json();
            console.log("서버 응답:", data);

            setResultMessage(data.message);
            setIsResultModalOpen(true);
            if (res.ok) {
                setShouldRefreshAfterModal(true);
                setShouldCloseAfterModal(true);
            }
        } catch (err) {
            console.error("전송 실패:", err);
        }
    }

    const handleResultConfirm = () => {
        setIsResultModalOpen(false);

        if (shouldRefreshAfterModal) onSaved?.();
        if (shouldCloseAfterModal) onCancel?.();

        setShouldRefreshAfterModal(false);
        setShouldCloseAfterModal(false);
    };

    // 경고 모달 창
    const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
    const openCheckModal = () => setIsCheckModalOpen(true);
    const closeCheckModal = () => setIsCheckModalOpen(false);

    const deleteMessage = (
        <>
        이벤트를 삭제하시겠습니까?
        <br />
        이 작업은 되돌릴 수 없습니다.
        </>
    );

    const removeEvent = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
            process.env.REACT_APP_API_BASE_URL + `/event/delete/${eventId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json().catch(() => ({}));

            const ok = res.ok && data.result;
            setResultMessage(data.message);

            if (ok) {
                setShouldRefreshAfterModal(true);
                setShouldCloseAfterModal(true);
            }
        } catch (err) {
            setResultMessage("네트워크 오류로 일정 삭제하지 못했습니다.");
        }

        closeCheckModal();
        setIsResultModalOpen(true);
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
                    <button type="submit" className="icon-btn add" aria-label="addTodo">
                        <span className="material-symbols-outlined">edit</span>
                    </button>
                    <span 
                        className="material-symbols-outlined get-pointer"
                        onClick={openCheckModal}
                    >
                        delete
                    </span>
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
            <ModalCheck open={isCheckModalOpen} onClose={closeCheckModal} onConfirm={removeEvent} message={deleteMessage} btnMsg={`Delete`}/>
        </form>
    );
  }

  export default UpdateEvent;