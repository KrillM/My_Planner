import { useEffect, useMemo, useState } from "react";
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

export default function CalendarPopover({onSelectDate, canSelect, selectedKey, onClose}) {
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

        <button
          type="button"
          className="cal-close"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="cal-weekdays">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((w) => (
          <div key={w} className="wd">{w}</div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((d) => {
          const key = ymdKey(d); // "YYYY-MM-DD"
          const info = dayMap[key] || { hasPlan:false, isTemporary:false };
          const isOutMonth = d.getMonth() !== viewMonth;

          const selectable = canSelect
            ? canSelect({ date: d, key, info, isOutMonth })
            : (!isOutMonth && !info.hasPlan); // 기본: 일정 있으면 선택 불가

          const isSelected = key === selectedKey;
          const disabled = !selectable || isSelected;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              className={[
                "day",
                isOutMonth ? "out" : "",
                info.hasPlan ? "has" : "empty",
                selectable && !isSelected ? "can-click" : "disabled",
                isSelected ? "selected" : ""
              ].filter(Boolean).join(" ")}
              onClick={() => {
                if (!selectable) return;
                onSelectDate?.(d);
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