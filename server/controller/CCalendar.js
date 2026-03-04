const { Date: PlanDate, Event } = require('../model');
const { Op } = require("sequelize");

const pad2 = (n) => String(n).padStart(2, "0");

// 달력
const showCalendar = async (req, res) => {
  try {
    const crewId = req.user.crewId;
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      return res.status(400).json({ message: "달력 정보가 없습니다." });
    }

    const rows = await PlanDate.findAll({
      where: { crewId, year, month },
      attributes: ["day", "isTemporary"],
      order: [["day", "ASC"]],
    });

    // Date 구하기
    const days = {};
    rows.forEach((r) => {
      const dd = pad2(r.day);
      days[dd] = {
        hasPlan: true,
        isTemporary: r.isTemporary === "Y",
      };
    });

    // Event 구하기
    const start = new Date(year, month - 1, 1, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59); // month의 마지막 날

    const eventRows = await Event.findAll({
      where: {
        crewId,
        // date_begin <= end AND date_end >= start  (겹치는 것 전부)
        date_begin: { [Op.lte]: end },
        date_end: { [Op.gte]: start },
      },
      attributes: [
        "eventId",
        "content",
        "date_begin",
        "date_end",
        "isUsedDay",
        "creationTime",
      ],
      order: [["creationTime", "ASC"]],
    });

    const eventList = eventRows.map((e) => ({
      eventId: e.eventId,
      content: e.content,
      dateBegin: e.date_begin,
      dateEnd: e.date_end,
      isDDay: e.isUsedDay === "Y",
      creationTime: e.creationTime,
    }));

    return res.status(200).json({
      year: String(year),
      month: pad2(month),
      days,
      eventList
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "달력 조회 실패" });
  }
}

module.exports = {
  showCalendar
}