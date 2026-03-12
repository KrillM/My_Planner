import { useEffect, useMemo, useState } from "react";
import CalendarEventPopover from "../calendar/CalendarEventPopover";
import ModalMessage from "../modals/ModalMessage";
import ModalCheck from "../modals/ModalCheck";
import "../styles/input.scss";
import "../styles/save.scss";

const defaultInitial = {
  slot: "period",
  repeat: "none",
  dateBegin: "",
  dateEnd: "",
  content: "",
  isUseDDay: false,
};

const normalize = (v) => {
  const merged = { ...defaultInitial, ...(v ?? {}) };
  const dateBegin = merged.dateBegin ?? "";
  const dateEnd = merged.dateEnd?.trim() ? merged.dateEnd : dateBegin;

  // slot/isUseTimeSlot 정합성 맞추기
  const isPeriod = dateBegin && dateEnd && dateBegin !== dateEnd;
  const slot = merged.slot ?? (isPeriod ? "period" : "singleDay");

  return {
    ...merged,
    dateBegin,
    dateEnd,
    slot,
  };
};

const EventForm = ({
  mode = "create", // "create" | "update"
  initialValues,
  onSubmit,
  onCancel,
  onDelete, // optional
}) => {
  const init = useMemo(() => normalize(initialValues), [initialValues]);

  const [slot, setSlot] = useState(init.slot);
  const [repeat, setRepeat] = useState(init.repeat);
  const [dateBegin, setDateBegin] = useState(init.dateBegin);
  const [dateEnd, setDateEnd] = useState(init.dateEnd);
  const [content, setContent] = useState(init.content);
  const [isUseDDay, setIsUseDDay] = useState(init.isUseDDay);

  const [isUseTimeSlot, setIsUseTimeSlot] = useState(init.slot === "period");

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calTarget, setCalTarget] = useState(null);

  const [isContentEmpty, setIsContentEmpty] = useState(false);
  const [isWrongTimeSlot, setIsWrongTimeSlot] = useState(false);
  const [isDateEmpty, setIsDateEmpty] = useState(false);

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const [shouldCloseAfterModal, setShouldCloseAfterModal] = useState(false);
  const [shouldRefreshAfterModal, setShouldRefreshAfterModal] = useState(false);

  // delete confirm
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // initialValues가 바뀔 수 있으니(수정 모달 열 때) 동기화
  useEffect(() => {
    const next = normalize(initialValues);

    setSlot(next.slot);
    setRepeat(next.repeat);
    setDateBegin(next.dateBegin);
    setDateEnd(next.dateEnd);
    setContent(next.content);
    setIsUseDDay(next.isUseDDay);

    setIsUseTimeSlot(next.slot === "period");

    setIsContentEmpty(false);
    setIsWrongTimeSlot(false);
    setIsDateEmpty(false);
  }, [init]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsWrongTimeSlot(dateBegin && dateEnd ? dateBegin > dateEnd : false);
  }, [dateBegin, dateEnd]);

  const validateContent = (value) => {
    setContent(value);
    if (isContentEmpty && value.trim() !== "") setIsContentEmpty(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const contentEmpty = content.trim() === "";
    const wrongTimeSlot = isUseTimeSlot === true && dateEnd !== "" && dateBegin > dateEnd;
    const dateEmpty = slot === "period" && dateBegin === "";

    setIsContentEmpty(contentEmpty);
    setIsWrongTimeSlot(wrongTimeSlot);
    setIsDateEmpty(dateEmpty);

    if (contentEmpty || wrongTimeSlot || dateEmpty) return;

    const finalDateEnd = dateEnd?.trim() ? dateEnd : dateBegin;

    try {
      const res = await onSubmit?.({
        slot,
        repeat,
        dateBegin,
        dateEnd: finalDateEnd,
        content,
        isUseDDay,
      });

      // onSubmit이 { ok, message, refresh, close } 형태로 리턴한다고 가정
      const ok = !!res?.ok;
      const message = res?.message ?? (ok ? "저장 완료" : "저장 실패");

      setResultMessage(message);
      setIsResultModalOpen(true);

      if (ok) {
        setShouldRefreshAfterModal(!!res?.refresh);
        setShouldCloseAfterModal(!!res?.close);
      }
    } catch (err) {
      setResultMessage("전송 실패");
      setIsResultModalOpen(true);
    }
  };

  const handleResultConfirm = () => {
    setIsResultModalOpen(false);

    if (shouldRefreshAfterModal) onSubmit?.onSaved?.(); // 안씀(하위 호환용) - 아래에서 res.refresh로 처리 추천
    if (shouldRefreshAfterModal) {
      // 부모에서 refresh가 필요하면 보통 onSaved를 따로 두는 게 깔끔
      // 근데 여기선 res.refresh + 부모에서 처리로 통일하는 걸 추천
    }

    if (shouldCloseAfterModal) onCancel?.();

    setShouldRefreshAfterModal(false);
    setShouldCloseAfterModal(false);
  };

  const deleteMessage = (
    <>
      이벤트를 삭제하시겠습니까?
      <br />
      이 작업은 되돌릴 수 없습니다.
    </>
  );

  const confirmDelete = async () => {
    try {
      const res = await onDelete?.();
      const ok = !!res?.ok;
      setResultMessage(res?.message ?? (ok ? "삭제 완료" : "삭제 실패"));
      setIsResultModalOpen(true);

      if (ok) {
        setShouldRefreshAfterModal(!!res?.refresh);
        setShouldCloseAfterModal(!!res?.close);
      }
    } catch (e) {
      setResultMessage("네트워크 오류로 일정 삭제하지 못했습니다.");
      setIsResultModalOpen(true);
    } finally {
      setIsCheckModalOpen(false);
    }
  };

  return (
    <form className="input-wrap" onSubmit={handleSubmit}>
      {isMobile ? (
        <>
          <div className="slot-row slot-row-mobile">
            <select
              name="timeSlotType"
              id="timeSlotType"
              className="pill pill-label pill-label-event"
              value={slot}
              onChange={(e) => {
                const val = e.target.value;
                setSlot(val);
                setIsUseTimeSlot(val === "period");

                if (val === "period") {
                  setIsUseDDay(false);
                } else if (dateBegin) {
                  setDateEnd(dateBegin);
                }
              }}
            >
              <option value="period">Period</option>
              <option value="singleDay">Day</option>
            </select>

            <div className="time-group time-group-mobile">
              <div className="pill-wrapper">
                <input
                  className="pill pill-time pill-time-event "
                  type="text"
                  value={dateBegin}
                  readOnly
                />
                <span
                  className="material-symbols-outlined"
                  onClick={() => {
                    setCalTarget("begin");
                    setIsCalendarOpen(true);
                  }}
                >
                  calendar_month
                </span>
              </div>

              {isUseTimeSlot ? (
                <>
                  <span className="tilde">~</span>

                  <div className="pill-wrapper">
                    <input
                      className="pill pill-time pill-time-event "
                      type="text"
                      value={dateEnd}
                      readOnly
                    />
                    <span
                      className="material-symbols-outlined"
                      onClick={() => {
                        setCalTarget("end");
                        setIsCalendarOpen(true);
                      }}
                    >
                      calendar_month
                    </span>
                  </div>
                </>
              ) : (
                <div
                  className={`set-toggle mobile-dday-toggle ${
                    isUseDDay ? "toggle-d-day-on" : "toggle-d-day-off"
                  }`}
                  onClick={() => setIsUseDDay((prev) => !prev)}
                >
                  {isUseDDay ? (
                    <span className="material-symbols-outlined">toggle_on</span>
                  ) : (
                    <span className="material-symbols-outlined">toggle_off</span>
                  )}
                  D-Day
                </div>
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

          <div className="content-row content-row-mobile">
            <input
              className="content-input"
              value={content}
              placeholder="내용"
              onChange={(e) => validateContent(e.target.value)}
            />

            <div className="event-icons">
              <button
                type="submit"
                className="icon-btn add"
                aria-label="saveEvent"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>

              {mode === "update" && typeof onDelete === "function" && (
                <span
                  className="material-symbols-outlined get-pointer"
                  onClick={() => setIsCheckModalOpen(true)}
                >
                  delete
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="slot-row slot-row-event">
            <select
              name="timeSlotType"
              id="timeSlotType"
              className="pill pill-event"
              value={slot}
              onChange={(e) => {
                const val = e.target.value;
                setSlot(val);
                setIsUseTimeSlot(val === "period");

                if (val === "period") {
                  setIsUseDDay(false);
                } else if (dateBegin) {
                  setDateEnd(dateBegin);
                }
              }}
            >
              <option value="period">Period</option>
              <option value="singleDay">Day</option>
            </select>

            <div className="time-group time-group-event">
              <div className="pill-wrapper">
                <input className="pill pill-time" type="text" value={dateBegin} readOnly />
                <span
                  className="material-symbols-outlined"
                  onClick={() => {
                    setCalTarget("begin");
                    setIsCalendarOpen(true);
                  }}
                >
                  calendar_month
                </span>
              </div>

              {isUseTimeSlot && (
                <>
                  <span className="tilde">~</span>
                  <div className="pill-wrapper">
                    <input className="pill pill-time" type="text" value={dateEnd} readOnly />
                    <span
                      className="material-symbols-outlined"
                      onClick={() => {
                        setCalTarget("end");
                        setIsCalendarOpen(true);
                      }}
                    >
                      calendar_month
                    </span>
                  </div>
                </>
              )}
            </div>

            <button type="button" className="close-btn" aria-label="close" onClick={onCancel}>
              ×
            </button>
          </div>

          <div className="content-row">
            <input
              className="content-input"
              value={content}
              placeholder="Event"
              onChange={(e) => validateContent(e.target.value)}
            />

            <div className="event-icons">
              {slot !== "period" && (
                <div
                  className={`set-toggle ${isUseDDay ? "toggle-d-day-on" : "toggle-d-day-off"}`}
                  onClick={() => setIsUseDDay((prev) => !prev)}
                >
                  {isUseDDay ? (
                    <span className="material-symbols-outlined">toggle_on</span>
                  ) : (
                    <span className="material-symbols-outlined">toggle_off</span>
                  )}
                  D-Day
                </div>
              )}

              <button type="submit" className="icon-btn add" aria-label="saveEvent">
                <span className="material-symbols-outlined">edit</span>
              </button>

              {mode === "update" && typeof onDelete === "function" && (
                <span className="material-symbols-outlined get-pointer" onClick={() => setIsCheckModalOpen(true)}>
                  delete
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {isContentEmpty && <p className="warning-message">이벤트 입력해주세요.</p>}
      {isWrongTimeSlot && isUseTimeSlot && <p className="warning-message">종료날짜는 시작날짜보다 빠를 수 없습니다.</p>}
      {isDateEmpty && isUseTimeSlot && <p className="warning-message">날짜를 입력해주세요.</p>}

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
                  if (slot !== "period") setDateEnd(ymd);
                  if (isDateEmpty && ymd) setIsDateEmpty(false);
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

      <ModalCheck
        open={isCheckModalOpen}
        onClose={() => setIsCheckModalOpen(false)}
        onConfirm={confirmDelete}
        message={deleteMessage}
        btnMsg="Delete"
      />
    </form>
  );
};

export default EventForm;