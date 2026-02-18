const { Date: PlanDate } = require('../model');

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

    // { "01": {hasPlan:true,isTemporary:false}, ... }
    const days = {};
    rows.forEach((r) => {
      const dd = pad2(r.day);
      days[dd] = {
        hasPlan: true,
        isTemporary: r.isTemporary === "Y",
      };
    });

    return res.status(200).json({
      year: String(year),
      month: pad2(month),
      days,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "달력 조회 실패" });
  }
}

module.exports = {
  showCalendar
}