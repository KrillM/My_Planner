import { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import '../styles/calendar.scss';

function pad2(n) {
  return String(n).padStart(2, "0");
}

function ymdKey(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

// month: 0~11
function buildCalendarCells(year, month) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0=Sun
  const startDate = new Date(year, month, 1 - startDay); // 그리드 시작(일요일)
  const cells = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0~11

  // 월 요약 상태 맵: { "2026-02-03": {hasPlan:true,isTemporary:false}, ... }
  const [dayMap, setDayMap] = useState({});

  const cells = useMemo(
    () => buildCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  useEffect(() => {
    const fetchMonth = async () => {
      const token = localStorage.getItem("token");
      const y = String(viewYear);
      const m = pad2(viewMonth + 1);

      const res = await fetch(
        process.env.REACT_APP_API_BASE_URL + `/calendar?year=${y}&month=${m}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      // data.days가 { "01": {...}, "02": {...} } 형태라면 아래처럼 key를 "YYYY-MM-DD"로 변환
      const next = {};
      Object.entries(data.days || {}).forEach(([dd, info]) => {
        next[`${y}-${m}-${dd}`] = info;
      });
      setDayMap(next);
    };

    fetchMonth();
  }, [viewYear, viewMonth]);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div className="cal">
      <div className="cal-header">
        <button
          type="button"
          onClick={() => {
            const prev = new Date(viewYear, viewMonth - 1, 1);
            setViewYear(prev.getFullYear());
            setViewMonth(prev.getMonth());
          }}
        >
          {"<"}
        </button>

        <div className="cal-title">
          {viewYear}.{pad2(viewMonth + 1)}
        </div>

        <button
          type="button"
          onClick={() => {
            const next = new Date(viewYear, viewMonth + 1, 1);
            setViewYear(next.getFullYear());
            setViewMonth(next.getMonth());
          }}
        >
          {">"}
        </button>
      </div>

      <div className="cal-weekdays">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((w) => (
          <div key={w} className="wd">{w}</div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((d) => {
          const key = ymdKey(d);
          const info = dayMap[key] || { hasPlan: false, isTemporary: false };

          const isOutMonth = d.getMonth() !== viewMonth;
          const isToday = isSameDay(d, today);

          // ✅ 너 조건 반영: 임시저장(노랑), 일정있음(진함), 없음(희미)
          const classCondition = [
            "day",
            isOutMonth ? "out" : "",
            isToday ? "today" : "",
            info.isTemporary ? "temp" : "",
            info.hasPlan ? "has" : "empty",
          ].filter(Boolean).join(" ");

          return (
            <button
              key={key}
              type="button"
              className={classCondition}
              onClick={() => {
                // 클릭시 상세 페이지로 가고 싶으면 여기서 navigate
                // 예: /260220 형태
                const yy = String(d.getFullYear()).slice(-2);
                const mm = pad2(d.getMonth() + 1);
                const dd = pad2(d.getDate());
                navigate(`/${yy}${mm}${dd}`);
              }}
            >
              <span className="num">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}