const { Crew, ToDo, Event, Date: PlanDate } = require("../model");
const { Op } = require("sequelize");

const getAlarms = async (req, res) => {
    try {
        const crewId = req.user.crewId;
        const now = new Date();

        // crew 알람 설정 조회
        const crew = await Crew.findOne({
            where: { crewId },
            attributes: ["crewId", "isUseAlarm", "alarmType", "alarm"],
        });

        if (!crew) {
            return res.status(404).json({
                result: false,
                message: "사용자를 찾을 수 없습니다.",
            });
        }

        const toDateKey = (dateObj) => {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, "0");
            const d = String(dateObj.getDate()).padStart(2, "0");
            return `${y}${m}${d}`;
        };

        const toDateKeyFromParts = (year, month, day) => {
            return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
        };

        const formatDateTitle = (year, month, day) => {
            return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
        };

        const calcDateLabel = (targetDate) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const target = new Date(targetDate);
            target.setHours(0, 0, 0, 0);

            const diffMs = target - today;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return "D-Day";
            if (diffDays > 0) return `D-${diffDays}`;
            return `D+${Math.abs(diffDays)}`;
        };

        const getAlarmMinutes = (alarmType, alarm) => {
            const value = Number(alarm);

            if (!value || value < 1) return 0;
            if (alarmType === "minute") return value;
            if (alarmType === "hour") return value * 60;
            if (alarmType === "day") return value * 1440;
            return 0;
        };

        const getRemainingMessage = (beginDate) => {
            const diffMs = new Date(beginDate) - new Date();
            const diffMinutes = Math.ceil(diffMs / (1000 * 60));

            if (diffMinutes < 60) return `${diffMinutes}분 뒤에 일정이 있습니다.`;

            const diffHours = Math.ceil(diffMinutes / 60);
            if (diffHours < 24) return `${diffHours}시간 뒤에 일정이 있습니다.`;

            const diffDays = Math.ceil(diffHours / 24);
            return `${diffDays}일 뒤에 일정이 있습니다.`;
        };

        // -------------------------
        // ToDo 알람
        // -------------------------
        let todoAlarms = [];

        if (crew.isUseAlarm === "Y") {
            const alarmMinutes = getAlarmMinutes(crew.alarmType, crew.alarm);

            if (alarmMinutes > 0) {
                const alarmRangeEnd = new Date(now.getTime() + alarmMinutes * 60 * 1000);

                const todos = await ToDo.findAll({
                    where: {
                        crewId,
                        isUseAlarm: "Y",
                        isDone: "N",
                        planBegin: {
                            [Op.gte]: now,
                            [Op.lte]: alarmRangeEnd,
                        },
                    },
                    order: [["planBegin", "ASC"]],
                });

                todoAlarms = todos.map((todo) => {
                    const begin = new Date(todo.planBegin);
                    const dateKey = toDateKey(begin);

                    return {
                        type: "event",
                        dateKey,
                        message: getRemainingMessage(todo.planBegin),
                        title: todo.content,
                        beginDate: todo.planBegin,
                    };
                });
            }
        }

        // -------------------------
        // Event 알람 : 30일 범위 유지
        // -------------------------
        const eventRangeEnd = new Date(now);
        eventRangeEnd.setDate(eventRangeEnd.getDate() + 30);

        const events = await Event.findAll({
            where: {
                crewId,
                date_begin: {
                    [Op.gte]: now,
                    [Op.lte]: eventRangeEnd,
                },
            },
            order: [["date_begin", "ASC"]],
        });

        const eventAlarms = events.map((event) => {
            const begin = new Date(event.date_begin);
            const dateKey = toDateKey(begin);

            return {
                type: "event",
                dateKey,
                message: calcDateLabel(begin),
                title: event.content,
                beginDate: event.date_begin,
            };
        });

        // -------------------------
        // event/todo가 존재하는 날짜 set
        // -------------------------
        const scheduleDateKeySet = new Set(
            [...todoAlarms, ...eventAlarms].map((item) => item.dateKey)
        );

        // -------------------------
        // D-Day(date) 알람
        // -------------------------
        const ddayDates = await PlanDate.findAll({
            where: {
                crewId,
                isUseDDay: "Y",
            },
            order: [
                ["year", "ASC"],
                ["month", "ASC"],
                ["day", "ASC"],
            ],
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ddayAlarms = ddayDates
            .map((dateRow) => {
                const targetDate = new Date(dateRow.year, dateRow.month - 1, dateRow.day);
                targetDate.setHours(0, 0, 0, 0);

                const dateKey = toDateKeyFromParts(dateRow.year, dateRow.month, dateRow.day);

                return {
                    type: "date",
                    dateKey,
                    dday: calcDateLabel(targetDate),
                    title: formatDateTitle(dateRow.year, dateRow.month, dateRow.day),
                    targetDate,
                };
            })
            .filter((item) => item.targetDate >= today)
            .filter((item) => !scheduleDateKeySet.has(item.dateKey));

        // -------------------------
        // 종합
        // -------------------------
        const alarms = [...todoAlarms, ...eventAlarms, ...ddayAlarms].sort((a, b) => {
            const aDate = a.beginDate
                ? new Date(a.beginDate)
                : new Date(
                    Number(a.dateKey.slice(0, 4)),
                    Number(a.dateKey.slice(4, 6)) - 1,
                    Number(a.dateKey.slice(6, 8))
                );

            const bDate = b.beginDate
                ? new Date(b.beginDate)
                : new Date(
                    Number(b.dateKey.slice(0, 4)),
                    Number(b.dateKey.slice(4, 6)) - 1,
                    Number(b.dateKey.slice(6, 8))
                );

            return aDate - bDate;
        });

        return res.json({
            result: true,
            alarms,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            result: false,
            message: "알람 목록 조회 중 오류가 발생했습니다.",
        });
    }
};

module.exports = {
    getAlarms,
};