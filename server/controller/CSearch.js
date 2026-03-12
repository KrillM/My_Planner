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

// 검색
const searchList = async (req, res) => {
    try {
        const crewId = req.user.crewId;
        const keyword = (req.query.keyword || "").trim();
        const type = (req.query.type || "date").trim().toLowerCase();

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

            const dateMap = new Map();
            dates.forEach((d) => {
                dateMap.set(d.dateId, d);
            });

            const events = await Event.findAll({
                where: {
                    crewId,
                    [Op.or]: dateIds.map((dateId) => {
                        const date = dateMap.get(dateId);
                        if (!date) return null;

                        const y = Number(date.year);
                        const m = Number(date.month) - 1;
                        const d = Number(date.day);

                        const dayStart = new Date(y, m, d, 0, 0, 0);
                        const dayEnd = new Date(y, m, d, 23, 59, 59);

                        return {
                            date_begin: { [Op.lte]: dayEnd },
                            date_end: { [Op.gte]: dayStart },
                        };
                    }).filter(Boolean),
                },
                order: [["date_begin", "ASC"]],
            });

            const eventMap = new Map();
            dateIds.forEach((id) => eventMap.set(id, []));

            events.forEach((event) => {
                dateIds.forEach((dateId) => {
                    const date = dateMap.get(dateId);
                    if (!date) return;

                    const y = Number(date.year);
                    const m = Number(date.month) - 1;
                    const d = Number(date.day);

                    const dayStart = new Date(y, m, d, 0, 0, 0);
                    const dayEnd = new Date(y, m, d, 23, 59, 59);

                    const begin = event.date_begin ? new Date(event.date_begin) : null;
                    const end = event.date_end ? new Date(event.date_end) : begin;

                    if (!begin || !end) return;

                    if (begin <= dayEnd && end >= dayStart) {
                        eventMap.get(dateId).push({
                            eventId: event.eventId,
                            content: event.content,
                            dateBegin: event.date_begin,
                            dateEnd: event.date_end,
                            isUseDDay: event.is_use_dday,
                        });
                    }
                });
            });

            const todoMap = new Map();
            dateIds.forEach((id) => todoMap.set(id, []));

            todoList.forEach((todo) => {
                if (!todoMap.has(todo.dateId)) return;

                todoMap.get(todo.dateId).push({
                    toDoId: todo.toDoId,
                    content: todo.content,
                    isUseAlarm: todo.isUseAlarm === "Y",
                    isDone: todo.isDone === "Y",
                    time: formatTimeLabel(todo.isUseTimeSlot, todo.planBegin, todo.planEnd),
                });
            });

            const searchList = dates.map((date) => ({
                dateId: date.dateId,
                dateLabel: formatDateLabel(date.year, date.month, date.day),
                year: date.year,
                month: date.month,
                day: date.day,
                memo: date.content || "",
                eventList: eventMap.get(date.dateId) || [],
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
            const eventList = await Event.findAll({
                where: {
                    crewId,
                    content: {
                        [Op.like]: `%${keyword}%`,
                    },
                },
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