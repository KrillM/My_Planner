const { Event, Date: PlanDate } = require("../model");
const { Op } = require("sequelize");

const getAlarms = async (req, res) => {
    try {
        const crewId = req.user.crewId;
        const now = new Date();

        // event: 지금부터 30일 안
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

        // event 알람
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

        // event가 존재하는 날짜 set
        const eventDateKeySet = new Set(eventAlarms.map((item) => item.dateKey));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 같은 날짜에 event가 있으면 dday 제외
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
            .filter((item) => !eventDateKeySet.has(item.dateKey));

        const alarms = [...eventAlarms, ...ddayAlarms].sort((a, b) => {
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