import { useEffect, useState } from "react";
import InputEvent from "./InputEvent";
import UpdateEvent from "./UpdateEvent";
import AddIcon from "../upsert/AddIcon.";
import "../styles/date.scss";

// v가 뭐가 오든 최대한 안전하게 YYYY-MM-DD만 뽑아 Date로 변환
function parseYmd(v) {
  if (v == null) return null;

  const s = String(v);
  // "Invalid date" 같은 경우 방어
  if (!s.includes("-")) return null;

  const ymd = s.slice(0, 10); // YYYY-MM-DD
  const parts = ymd.split("-");
  if (parts.length !== 3) return null;

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d);
}

function formatKoreanDate(d) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function isSameYmd(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfToday() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

// 오늘 기준: 오늘=D-Day, 미래=D-3, 과거=D+2
function formatDDay(targetDate) {
  if (!targetDate) return "";
  const today = startOfToday();
  const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "D-Day";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

const EventList = () => {
  const [eventList, setEventList] = useState([]);
  const [showInputEvent, setShowInputEvent] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const fetchEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/event/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setEventList(Array.isArray(data.eventList) ? data.eventList : []);
    } catch (e) {
      console.error("이벤트 조회 실패:", e);
      setEventList([]);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, []);

  return (
    <div className="date-container">
      <div className="planner-header">
        <h1 className="date-content">Event</h1>
      </div>

      <div className="toDo-list">
        {eventList.map((event) => (
          <div key={event.eventId}>
            {selectedEventId === event.eventId ? (
              <UpdateEvent
                eventId={event.eventId}
                event={event} 
                onSaved={() => {
                  fetchEvent();
                  setSelectedEventId(null);
                }}
                onCancel={() => setSelectedEventId(null)}
              />
            ) : (
              <div className="toDo-detail">
                <div className="toDo-content get-pointer">
                  {(() => {
                    const beginRaw =
                      event.dateBegin ?? event.date_begin ?? event.dateBeginTime ?? event.date_begin_time;
                    const endRaw =
                      event.dateEnd ?? event.date_end ?? event.dateEndTime ?? event.date_end_time;

                    const beginDate = parseYmd(beginRaw);
                    const endDate = parseYmd(endRaw) || beginDate;

                    const dateText =
                      beginDate && endDate
                        ? (isSameYmd(beginDate, endDate)
                            ? formatKoreanDate(beginDate)
                            : `${formatKoreanDate(beginDate)} ~ ${formatKoreanDate(endDate)}`)
                        : "";

                    const isUseDDay = (event.isUseDDay ?? event.isUsedDay ?? event.is_use_dday) === "Y";
                    const ddayText = isUseDDay && beginDate ? formatDDay(beginDate) : "";

                    return dateText ? (
                      <div className="event-date-line">
                        <span className="event-date">{dateText}</span>
                        {ddayText && <span className="event-dday">{ddayText}</span>}
                      </div>
                    ) : null;
                  })()}

                  <div className="content-row">{event.content}</div>
                </div>

                <div className="toDo-checkbox get-pointer">
                  <span
                    className="material-symbols-outlined"
                    onClick={() => setSelectedEventId(event.eventId)}  // ✅ 인라인 편집 열기
                  >
                    edit
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showInputEvent && (
        <InputEvent
          onCancel={() => setShowInputEvent(false)}
          onSaved={() => fetchEvent()}
        />
      )}

      <AddIcon onClick={() => setShowInputEvent(true)} />
    </div>
  );
};

export default EventList;