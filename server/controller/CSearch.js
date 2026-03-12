const { Date: PlanDate, ToDo, Event, Frequency, List: FrequencyList } = require("../model");
const { Op } = require("sequelize");

// 시간 라벨
const formatTimeLabel = (isUseTimeSlot, planBegin, planEnd) => {
    const toHHmm = (value) => {
        if (!value) return "";

        // Date 객체
        if (value instanceof Date) {
            const h = String(value.getHours()).padStart(2, "0");
            const m = String(value.getMinutes()).padStart(2, "0");
            return `${h}:${m}`;
        }

        const str = String(value).trim();

        // 2026-02-27T14:00:00.000Z
        if (str.includes("T")) {
            const timePart = str.split("T")[1];
            return timePart ? timePart.slice(0, 5) : "";
        }

        // 2026-02-27 14:00:00
        if (str.includes(" ")) {
            const timePart = str.split(" ")[1];
            return timePart ? timePart.slice(0, 5) : "";
        }

        // 14:00:00
        if (/^\d{2}:\d{2}:\d{2}$/.test(str)) {
            return str.slice(0, 5);
        }

        // 14:00
        if (/^\d{2}:\d{2}$/.test(str)) {
            return str;
        }

        return "";
    };

    const toSlotLabel = (hhmm) => {
        if (!hhmm) return "";

        const hour = Number(hhmm.slice(0, 2));

        if (hour === 4) return "오전";
        if (hour === 12) return "오후";
        if (hour === 18) return "저녁";
        if (hour === 21) return "밤";

        return hhmm;
    };

    const begin = toHHmm(planBegin);
    const end = toHHmm(planEnd);

    // 시간 슬롯 사용 안 함 -> 오전/오후/저녁/밤
    if (isUseTimeSlot === "N") {
        return toSlotLabel(begin);
    }

    // 시간 직접 사용
    if (!begin && !end) return "";
    if (begin && end) return `${begin} ~ ${end}`;
    return begin || end || "";
};

// 날짜 문자열
const formatDateLabel = (year, month, day) => { 
    return `${year}년 ${Number(month)}월 ${Number(day)}일`;
};

// 날짜 계산
const makeDateKey = (year, month, day) => {
    return Number(year) * 10000 + Number(month) * 100 + Number(day);
};

const makeYmdKey = (ymd) => {
    if (!ymd) return null;
    const [y, m, d] = ymd.split("-").map(Number);
    if (!y || !m || !d) return null;
    return y * 10000 + m * 100 + d;
};

const makeDateTimeRange = (dateBegin, dateEnd) => {
    if (!dateBegin || !dateEnd) {
        return { start: null, end: null };
    }

    const [by, bm, bd] = dateBegin.split("-").map(Number);
    const [ey, em, ed] = dateEnd.split("-").map(Number);

    if (!by || !bm || !bd || !ey || !em || !ed) {
        return { start: null, end: null };
    }

    return {
        start: new Date(by, bm - 1, bd, 0, 0, 0),
        end: new Date(ey, em - 1, ed, 23, 59, 59),
    };
};

// 검색
const searchList = async (req, res) => {
    try {
        const crewId = req.user.crewId;
        const keyword = (req.query.keyword || "").trim();
        const type = (req.query.type || "date").trim().toLowerCase();
        const dateBegin = (req.query.dateBegin || "").trim();
        const dateEnd = (req.query.dateEnd || "").trim();

        if (!keyword) {
            return res.status(400).json({
                message: "검색어가 비어 있습니다.",
            });
        }

        // -------------------------
        // DATE 검색
        // ToDo.content 에서 키워드 검색
        // 검색 결과는 날짜별 묶음 + 해당 날짜의 todo/event 같이 반환
        // -------------------------
        if (type === "date") {
            const todoList = await ToDo.findAll({
                where: {
                    crewId,
                    content: {
                        [Op.like]: `%${keyword}%`,
                    },
                },
                order: [["dateId", "ASC"], ["planBegin", "ASC"]],
            });

            if (!todoList.length) {
                return res.status(200).json({
                    message: "Date 검색 성공",
                    searchList: [],
                });
            }

            const dateIds = [...new Set(todoList.map((t) => t.dateId).filter(Boolean))];

            const dates = await PlanDate.findAll({
                where: {
                    crewId,
                    dateId: { [Op.in]: dateIds },
                    isTemporary: "N",
                },
                order: [
                    ["year", "ASC"],
                    ["month", "ASC"],
                    ["day", "ASC"],
                ],
            });

            const beginKey = makeYmdKey(dateBegin);
            const endKey = makeYmdKey(dateEnd);

            const filteredDates = dates.filter((date) => {
                if (!beginKey || !endKey) return true;

                const currentKey = makeDateKey(date.year, date.month, date.day);
                return currentKey >= beginKey && currentKey <= endKey;
            });

            if (!filteredDates.length) {
                return res.status(200).json({
                    message: "Date 검색 성공",
                    searchList: [],
                });
            }

            const filteredDateIdSet = new Set(filteredDates.map((d) => d.dateId));

            const todoMap = new Map();
            filteredDates.forEach((date) => todoMap.set(date.dateId, []));

            todoList.forEach((todo) => {
                if (!filteredDateIdSet.has(todo.dateId)) return;

                todoMap.get(todo.dateId).push({
                    toDoId: todo.toDoId,
                    content: todo.content,
                    isUseAlarm: todo.isUseAlarm === "Y",
                    isDone: todo.isDone === "Y",
                    time: formatTimeLabel(todo.isUseTimeSlot, todo.planBegin, todo.planEnd),
                });
            });

            const searchList = filteredDates.map((date) => ({
                dateId: date.dateId,
                dateLabel: formatDateLabel(date.year, date.month, date.day),
                year: date.year,
                month: date.month,
                day: date.day,
                memo: date.content || "",
                toDoList: todoMap.get(date.dateId) || [],
            }));

            return res.status(200).json({
                message: "Date 검색 성공",
                searchList,
            });
        }

        // -------------------------
        // FREQUENCY 검색
        // FrequencyList(List)에서 키워드 검색
        // 결과는 frequency 정보 반환
        // -------------------------
        if (type === "frequency") {
            const lists = await FrequencyList.findAll({
                where: {
                    crewId,
                    content: {
                        [Op.like]: `%${keyword}%`,
                    },
                },
                order: [["frequencyId", "DESC"]],
            });

            const titleMatches = await Frequency.findAll({
                where: {
                    crewId,
                    title: {
                        [Op.like]: `%${keyword}%`,
                    },
                },
            });

            const listFrequencyIds = lists.map((item) => item.frequencyId);
            const titleFrequencyIds = titleMatches.map((item) => item.frequencyId);

            const frequencyIds = [...new Set([
                ...listFrequencyIds,
                ...titleFrequencyIds
            ])].filter(Boolean);

            if (!frequencyIds.length) {
                return res.status(200).json({
                    message: "Frequency 검색 성공",
                    searchList: [],
                });
            }

            const frequencyList = await Frequency.findAll({
                where: {
                    crewId,
                    frequencyId: {
                        [Op.in]: frequencyIds,
                    },
                },
                order: [["frequencyCount", "DESC"]],
            });

            const searchList = frequencyList.map((frequency) => ({
                frequencyId: frequency.frequencyId,
                title: frequency.title,
                frequencyCount: frequency.frequencyCount,
            }));

            return res.status(200).json({
                message: "Frequency 검색 성공",
                searchList,
            });
        }

        // -------------------------
        // EVENTS 검색
        // Event.content 에서 키워드 검색
        // -------------------------
        if (type === "events") {
            const { start, end } = makeDateTimeRange(dateBegin, dateEnd);

            const where = {
                crewId,
                content: {
                    [Op.like]: `%${keyword}%`,
                },
            };

            if (start && end) {
                where.date_begin = { [Op.lte]: end };
                where.date_end = { [Op.gte]: start };
            }

            const eventList = await Event.findAll({
                where,
                order: [["date_begin", "ASC"]],
            });

            return res.status(200).json({
                message: "Event 검색 성공",
                searchList: eventList,
            });
        }

        return res.status(400).json({
            message: "잘못된 검색 타입입니다.",
        });
    } catch (err) {
        console.error("검색 중 오류:", err);
        return res.status(500).json({
            message: "검색 중 오류가 발생했습니다.",
        });
    }
};

module.exports = {
    searchList,
};