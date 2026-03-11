import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/date.scss";

const SearchList = () => {
    const [searchList, setSearchList] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const keyword = searchParams.get("keyword") || "";
    const type = searchParams.get("type") || "date";

    const parseYmd = (raw) => {
        if (!raw) return null;

        if (raw instanceof Date) return raw;

        const str = String(raw).trim();

        // yyyy-mm-dd 또는 yyyy-mm-dd hh:mm:ss
        if (str.includes("-")) {
            const datePart = str.slice(0, 10);
            const [y, m, d] = datePart.split("-").map(Number);
        if (!y || !m || !d) return null;
            return new Date(y, m - 1, d);
        }

        // yyyymmdd
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
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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

    const fetchSearchList = async () => {
        try {
            const token = localStorage.getItem("token");
            const query = new URLSearchParams({
                keyword,
                type,
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
    }, [keyword, type]);

    const moveType = (nextType) => {
        navigate(`/search?keyword=${encodeURIComponent(keyword)}&type=${nextType}`);
    };

    const renderSectionTitle = () => {
        if (type === "date") return "Date";
        if (type === "frequency") return "Frequency";
        return "Events";
    };

    return (
        <div className="date-container">
            <div className="planner-header">
                <h1 className="date-content">“{keyword}” 검색 결과</h1>
            </div>

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


            <div className="toDo-list">
                {searchList.length > 0 ? (
                    searchList.map((item, idx) => {
                        const beginRaw =
                        item.dateBegin ??
                        item.date_begin ??
                        item.dateBeginTime ??
                        item.date_begin_time;

                        const endRaw =
                        item.dateEnd ??
                        item.date_end ??
                        item.dateEndTime ??
                        item.date_end_time;

                        const beginDate = parseYmd(beginRaw);
                        const endDate = parseYmd(endRaw) || beginDate;

                        const dateText =
                        beginDate && endDate
                            ? isSameYmd(beginDate, endDate)
                            ? formatKoreanDate(beginDate)
                            : `${formatKoreanDate(beginDate)} ~ ${formatKoreanDate(endDate)}`
                            : "";

                        const isUseDDay = (item.isUseDDay ?? item.isUsedDay ?? item.is_use_dday) === "Y";

                        const ddayText = isUseDDay && beginDate ? formatDDay(beginDate) : "";

                        return (
                            <div key={item.eventId || item.dateId || item.frequencyId || idx}>
                                <div className="toDo-detail">
                                <div className="toDo-content get-pointer">
                                    {dateText ? (
                                    <div className="event-date-line">
                                        <span className="event-date">{dateText}</span>
                                        {ddayText && <span className="event-dday">{ddayText}</span>}
                                    </div>
                                    ) : null}

                                    <div className="content-row">
                                    {item.content || item.title || item.name || "제목 없음"}
                                    </div>
                                </div>
                                </div>
                            </div>
                            );
                        })
                    ) : (
                    <div className="empty-search-result">검색 결과가 존재하지 않습니다.</div>
                )}
            </div>
        </div>
    );
};

export default SearchList;