import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UpdateEvent from "../event/UpdateEvent";
import CalendarEventPopover from "../calendar/CalendarEventPopover";
import "../styles/date.scss";

const SearchList = () => {
    const [searchList, setSearchList] = useState([]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calTarget, setCalTarget] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const keyword = searchParams.get("keyword") || "";
    const type = searchParams.get("type") || "date";

    const formatYmd = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const parseYmd = (raw) => {
        if (!raw) return null;
        if (raw instanceof Date) return raw;

        const str = String(raw).trim();

        if (str.includes("-")) {
            const datePart = str.slice(0, 10);
            const [y, m, d] = datePart.split("-").map(Number);
            if (!y || !m || !d) return null;
            return new Date(y, m - 1, d);
        }

        if (/^\d{8}$/.test(str)) {
            const y = Number(str.slice(0, 4));
            const m = Number(str.slice(4, 6));
            const d = Number(str.slice(6, 8));
            return new Date(y, m - 1, d);
        }
        return null;
    };

    const isSameYmd = (a, b) => {
        if (!a || !b) return false;
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    };

    const formatKoreanDate = (date) => {
        if (!date) return "";
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const formatDDay = (targetDate) => {
        if (!targetDate) return "";

        const today = new Date();
        const startOfToday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );
        const startOfTarget = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate()
        );

        const diffTime = startOfTarget.getTime() - startOfToday.getTime();
        const diffDay = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDay === 0) return "D-Day";
        if (diffDay > 0) return `D-${diffDay}`;
        return `D+${Math.abs(diffDay)}`;
    };

    const getDefaultDates = () => {
        const today = new Date();

        const begin = new Date(today);
        begin.setDate(begin.getDate() - 7);

        const end = new Date(today);
        end.setDate(end.getDate() + 7);

        return {
            begin: formatYmd(begin),
            end: formatYmd(end),
        };
    };

    const defaultDates = getDefaultDates();

    const [dateBegin, setDateBegin] = useState(defaultDates.begin);
    const [dateEnd, setDateEnd] = useState(defaultDates.end);

    const fetchSearchList = async () => {
        try {
            const token = localStorage.getItem("token");
            const query = new URLSearchParams({
                keyword,
                type,
                dateBegin,
                dateEnd
            }).toString();

            const res = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/search?${query}`,
                {
                headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "검색 실패");

            setSearchList(Array.isArray(data.searchList) ? data.searchList : []);
        } catch (e) {
            console.error("검색 조회 실패:", e);
            setSearchList([]);
        }
    };

    useEffect(() => {
        if (!keyword.trim()) {
            setSearchList([]);
            return;
        }
        fetchSearchList();
    }, [keyword, type, dateBegin, dateEnd]);

    const moveType = (nextType) => {
        navigate(`/search?keyword=${encodeURIComponent(keyword)}&type=${nextType}&dateBegin=${dateBegin}&dateEnd=${dateEnd}`);
    };

    // 이벤트 수정
    const [selectedEventId, setSelectedEventId] = useState(null);

    // 날짜 계산
    const handleSelectSearchDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const ymd = `${y}-${m}-${dd}`;

        if (calTarget === "begin") {
            setDateBegin(ymd);
            if (dateEnd && ymd > dateEnd) setDateEnd(ymd);
        } else if (calTarget === "end") {
            setDateEnd(ymd);
            if (dateBegin && ymd < dateBegin) setDateBegin(ymd);
        }

        setIsCalendarOpen(false);
    };

    useEffect(() => {
        if (!dateBegin || !dateEnd) return;

        if (dateBegin > dateEnd) {
            setDateEnd(dateBegin);
        }
    }, [dateBegin]);

    useEffect(() => {
        if (!dateBegin || !dateEnd) return;

        if (dateEnd < dateBegin) {
            setDateBegin(dateEnd);
        }
    }, [dateEnd]);

    const moveDate = (dateItem) => {
        const y = String(dateItem.year).slice(2);
        const m = String(dateItem.month).padStart(2, "0");
        const d = String(dateItem.day).padStart(2, "0");

        const dateKey = `${y}${m}${d}`;

        navigate(`/${dateKey}`);
    };

    const renderEventList = () => {
        if (searchList.length === 0) {
            return <div className="empty-search-result">검색 결과가 존재하지 않습니다.</div>;
        }

        return (
            <div className="toDo-list">
            {searchList.map((event, idx) => (
                <div key={event.eventId || idx}>
                    {selectedEventId === event.eventId ? (
                        <UpdateEvent
                            eventId={event.eventId}
                            event={event}
                            onSaved={() => {
                            fetchSearchList();
                            setSelectedEventId(null);
                        }}
                        onCancel={() => setSelectedEventId(null)}
                        />
                    ) : (
                        <div className="toDo-detail">
                            <div className="toDo-content get-pointer">
                                {(() => {
                                const beginRaw =
                                    event.dateBegin ??
                                    event.date_begin ??
                                    event.dateBeginTime ??
                                    event.date_begin_time;

                                const endRaw =
                                    event.dateEnd ??
                                    event.date_end ??
                                    event.dateEndTime ??
                                    event.date_end_time;

                                const beginDate = parseYmd(beginRaw);
                                const endDate = parseYmd(endRaw) || beginDate;

                                const dateText =
                                    beginDate && endDate
                                    ? isSameYmd(beginDate, endDate)
                                        ? formatKoreanDate(beginDate)
                                        : `${formatKoreanDate(beginDate)} ~ ${formatKoreanDate(endDate)}`
                                    : "";

                                const isUseDDay =
                                    (event.isUseDDay ?? event.isUsedDay ?? event.is_use_dday) === "Y";

                                const ddayText =
                                    isUseDDay && beginDate ? formatDDay(beginDate) : "";

                                return dateText ? (
                                    <div className="event-date-line">
                                    <span className="event-date">{dateText}</span>
                                    {ddayText && <span className="event-dday">{ddayText}</span>}
                                    </div>
                                ) : null;
                                })()}

                                <div className="content-row">
                                    <span className="toDo-content">{event.content}</span>
                                </div>
                            </div>

                            <div className="toDo-checkbox get-pointer">
                                <span
                                    className="material-symbols-outlined"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEventId(event.eventId);
                                    }}
                                >
                                    edit
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            </div>
        );
    };

    const renderFrequencyList = () => {
        if (searchList.length === 0) {
            return <div className="empty-search-result">검색 결과가 존재하지 않습니다.</div>;
        }

        return (
            <div className="toDo-list">
                {searchList.map((frequency, idx) => (
                <div key={frequency.frequencyId || idx} className="toDo-detail">
                    <div
                        className="toDo-content get-pointer"
                        onClick={() => navigate(`/frequency/${frequency.frequencyId}`)}
                    >
                        <div className="content-row">{frequency.title}</div>
                    </div>
                </div>
                ))}
            </div>
        );
    };

    const renderDateList = () => {
        if (searchList.length === 0) {
            return <div className="empty-search-result">검색 결과가 존재하지 않습니다.</div>;
        }

        return (
            <div className="toDo-list">
                {searchList.map((dateItem) => (
                    <div key={dateItem.dateId} className="search-date-group">
                        <div className="planner-header get-pointer" onClick={() => moveDate(dateItem)}>
                            <h2 className="date-content">{dateItem.dateLabel}</h2>
                        </div>

                        {dateItem.eventList?.length > 0 && dateItem.eventList.map((e, eIdx) => (
                            <div key={e.eventId || eIdx} className="toDo-detail">
                                <div className="content-row">
                                    <span className="toDo-content">{e.content}</span>
                                </div>
                            </div>
                        ))}

                        {dateItem.toDoList?.map((toDo, tIdx) => (
                            <div key={toDo.toDoId || tIdx} className="toDo-detail">
                                <div className="toDo-content">
                                    <span className="toDo-time">{toDo.time}</span>
                                    <div className="content-row">
                                        <span className="toDo-content">{toDo.content}</span>
                                        {toDo.isUseAlarm && (
                                            <span className="material-symbols-outlined notif-icon">
                                                notifications
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    const renderSearchResult = () => {
        if (type === "date") return renderDateList();
        if (type === "frequency") return renderFrequencyList();
        return renderEventList();
    };

    return (
        <>
        <div className="date-container">
            <div className="planner-header">
                <h1 className="date-content">“{keyword}” 검색 결과</h1>
            </div>

            <div className="search-filter-row">
                <div className="search-tab-wrap">
                    <select
                        className="search-tab"
                        value={type}
                        onChange={(e) => moveType(e.target.value)}
                    >
                        <option value="date">Date</option>
                        <option value="frequency">Frequency</option>
                        <option value="events">Events</option>
                    </select>
                </div>

                <div className="search-time-group">
                    <div
                        className="search-pill-wrapper"
                        onClick={() => {
                            setCalTarget("begin");
                            setIsCalendarOpen(true);
                        }}
                    >
                        <input
                            className="search-pill-time"
                            type="text"
                            value={dateBegin}
                            placeholder="시작 날짜"
                            readOnly
                        />
                        <span className="material-symbols-outlined">calendar_month</span>
                    </div>

                    <span className="tilde">~</span>

                    <div
                        className="search-pill-wrapper"
                        onClick={() => {
                            setCalTarget("end");
                            setIsCalendarOpen(true);
                        }}
                    >
                        <input
                            className="search-pill-time"
                            type="text"
                            value={dateEnd}
                            placeholder="종료 날짜"
                            readOnly
                        />
                        <span className="material-symbols-outlined">calendar_month</span>
                    </div>
                </div>
            </div>
            {renderSearchResult()}
        </div>

        {isCalendarOpen && (
            <div className="cal-modal-overlay" onClick={() => setIsCalendarOpen(false)}>
                <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
                    <CalendarEventPopover
                        onSelectDate={handleSelectSearchDate}
                        canSelect={() => true}
                        onClose={() => setIsCalendarOpen(false)}
                    />
                </div>
            </div>
        )}
        </>
    );
};

export default SearchList;