const { Date: PlanDate, DateMemo, sequelize } = require("../model");

const parseDateKey = (dateKey) => {
  const y = "20" + dateKey.slice(0, 2);
  const m = dateKey.slice(2, 4);
  const d = dateKey.slice(4, 6);
  return { y, m, d };
};

const upsertMemo = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const crewId = req.user.crewId;
    const { dateKey } = req.params;

    const { y, m, d } = parseDateKey(dateKey);
    const memoText = (req.body.memo ?? "").trim();
    const now = new Date();

    // 1) 해당 날짜 계획 찾기
    const dateRow = await PlanDate.findOne({
      where: { crewId, year: y, month: m, day: d },
      order: [["dateId", "DESC"]],
      transaction,
    });

    if (!dateRow) {
      await transaction.rollback();
      return res.status(404).json({ result: false, message: "해당 날짜 일정이 없습니다." });
    }

    const dateId = dateRow.dateId;

    // 2) 메모가 있어야 수정 가능
    const memoRow = await DateMemo.findOne({
      where: { crewId, dateId },
      order: [["dateMemoId", "DESC"]],
      transaction,
    });

    if (!memoRow) {
      await transaction.rollback();
      return res.status(404).json({ result: false, message: "수정할 메모가 없습니다." });
    }

    // 3) 빈 값이면 “삭제”로 볼지 정책 결정
    // 여기서는 "내용 비우기(업데이트)"로 처리
    await DateMemo.update(
      { content: memoText, modifyTime: now },
      { where: { crewId, dateId, dateMemoId: memoRow.dateMemoId }, transaction }
    );

    await transaction.commit();
    return res.status(200).json({ result: true, message: "메모가 수정되었습니다." });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    return res.status(500).json({ result: false, message: "메모 수정 중 오류" });
  }
};

module.exports = {
  upsertMemo
}