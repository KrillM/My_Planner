import { useEffect, useMemo, useState } from "react";
import { pad2, ymdKey, buildCalendarCells } from "./CalendarUtils";
import { useNavigate } from 'react-router-dom';
import '../styles/calendar-page.scss';

function toDateOnlyKey(d) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${y}-${m}-${dd}`;
}

function sameYMD(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function colorFromId(id) {
  const n = Number(id) || 0;
  const hue = (n * 47) % 360;
  return `hsl(${hue} 55% 75%)`;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [dayMap, setDayMap] = useState({});
  const [eventList, setEventList] = useState([]);

  const cells = useMemo(
    () => buildCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const weeks = useMemo(() => {
    const out = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cells]);

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

      const next = {};
      Object.entries(data.days || {}).forEach(([dd, info]) => {
        next[`${y}-${m}-${dd}`] = info;
      });

      setDayMap(next);
      setEventList(Array.isArray(data.eventList) ? data.eventList : []);
    };

    fetchMonth();
  }, [viewYear, viewMonth]);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const { singleEvents, rangeEvents } = useMemo(() => {
    const singles = [];
    const ranges = [];

    for (const e of eventList) {
      const bd = new Date(e.dateBegin);
      const ed = new Date(e.dateEnd);

      if (sameYMD(bd, ed)) singles.push({ ...e, begin: bd, end: ed });
      else ranges.push({ ...e, begin: bd, end: ed });
    }

    return { singleEvents: singles, rangeEvents: ranges };
  }, [eventList]);

  const getSinglesForDate = (dateObj) => {
    const key = toDateOnlyKey(dateObj);
    return singleEvents.filter((e) => toDateOnlyKey(e.begin) === key);
  };

  const hasAnyEventOnDate = (dateObj) => {
    const key = toDateOnlyKey(dateObj);

    const hasSingle = singleEvents.some((e) => toDateOnlyKey(e.begin) === key);

    const hasRange = rangeEvents.some((e) => {
      const d0 = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
      const d1 = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
      return e.begin <= d1 && e.end >= d0;
    });

    return hasSingle || hasRange;
  };

  const hasMovableEventOnDate = (dateObj) => {
    const key = toDateOnlyKey(dateObj);

    const hasSingle = singleEvents.some((e) => {
      if (e.repeat === "monthly" || e.repeat === "yearly") return false;
      return toDateOnlyKey(e.begin) === key;
    });

    const hasRange = rangeEvents.some((e) => {
      if (e.repeat === "monthly" || e.repeat === "yearly") return false;

      const d0 = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
      const d1 = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

      return e.begin <= d1 && e.end >= d0;
    });

    return hasSingle || hasRange;
  };

  const buildWeekBars = (weekDates) => {
    const weekStart = new Date(
      weekDates[0].getFullYear(),
      weekDates[0].getMonth(),
      weekDates[0].getDate(),
      0, 0, 0
    );
    const weekEnd = new Date(
      weekDates[6].getFullYear(),
      weekDates[6].getMonth(),
      weekDates[6].getDate(),
      23, 59, 59
    );

    const inStartIdx = weekDates.findIndex(d => d.getMonth() === viewMonth);
    const inEndIdx = (() => {
      for (let i = 6; i >= 0; i--) {
        if (weekDates[i].getMonth() === viewMonth) return i;
      }
      return -1;
    })();

    if (inStartIdx === -1 || inEndIdx === -1) return [];

    const overlapped = rangeEvents
      .filter((e) => e.begin <= weekEnd && e.end >= weekStart)
      .map((e) => {
        const segStart = e.begin < weekStart ? weekStart : e.begin;
        const segEnd = e.end > weekEnd ? weekEnd : e.end;

        let startIdx = weekDates.findIndex((d) => sameYMD(d, segStart));
        let endIdx = weekDates.findIndex((d) => sameYMD(d, segEnd));

        if (startIdx < 0) startIdx = 0;
        if (endIdx < 0) endIdx = 6;

        startIdx = Math.max(startIdx, inStartIdx);
        endIdx = Math.min(endIdx, inEndIdx);

        if (startIdx > endIdx) return null;

        return {
          eventId: e.eventId,
          content: e.content,
          color: colorFromId(e.eventId),
          startIdx,
          endIdx,
        };
      })
      .filter(Boolean);

    return overlapped;
  };

  const yearOptions = useMemo(() => {
    const base = today.getFullYear();
    const start = base - 5;
    const end = base + 5;
    const arr = [];
    for (let y = start; y <= end; y++) arr.push(y);
    return arr;
  }, [today]);

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <div className="calendar-page">
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
            <select
              className="cal-select year"
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              className="cal-select month"
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{pad2(m + 1)}</option>
              ))}
            </select>
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

        <div className="cal-weeks">
          {weeks.map((weekDates, wi) => {
            const bars = buildWeekBars(weekDates);
            const hasBars = bars.length > 0;

            return (
              <div key={wi} className={`week-row ${hasBars ? "has-bars" : "no-bars"}`}>
                <div className="week-bars">
                  {bars.map((b, idx) => {
                    const span = b.endIdx - b.startIdx + 1;
                    return (
                      <div
                        key={`${b.eventId}-${idx}`}
                        className="bar"
                        title={b.content}
                        style={{
                          left: `calc(${b.startIdx} * (100% / 7))`,
                          width: `calc(${span} * (100% / 7))`,
                          top: `${idx * 18}px`,
                          background: b.color,
                        }}
                      >
                        <span className="bar-text">{b.content}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="week-cells">
                  {weekDates.map((d) => {
                    const key = ymdKey(d);
                    const info = dayMap[key] || { hasPlan: false, isTemporary: false };

                    const isOutMonth = d.getMonth() !== viewMonth;
                    const isToday = isSameDay(d, today);

                    const hasEvent = !isOutMonth && hasAnyEventOnDate(d);
                    const hasMovableEvent = !isOutMonth && hasMovableEventOnDate(d);

                    const planVisible = !isOutMonth && (info.hasPlan || hasEvent);
                    const canMove = !isOutMonth && (info.hasPlan || hasMovableEvent);

                    const classCondition = [
                      "day",
                      isOutMonth ? "out" : "",
                      isToday ? "today" : "",
                      info.isTemporary ? "temp" : "",
                      planVisible ? "has" : "empty",
                      canMove ? "can-click" : "disabled",
                    ].filter(Boolean).join(" ");

                    const singles = !isOutMonth ? getSinglesForDate(d) : [];

                    return (
                      <button
                        key={key}
                        type="button"
                        className={classCondition}
                        disabled={!canMove}
                        onClick={() => {
                          if (!canMove) return;
                          const yy = String(d.getFullYear()).slice(-2);
                          const mm = pad2(d.getMonth() + 1);
                          const dd = pad2(d.getDate());
                          navigate(`/${yy}${mm}${dd}`);
                        }}
                      >
                        <span className="num">{d.getDate()}</span>

                        <div className="single-list">
                          {singles.map((e) => (
                            <div
                              key={e.eventId}
                              className={`single-item ${e.isDDay ? "dday" : "normal"}`}
                              title={e.content}
                            >
                              {e.content}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}