const { Date: PlanDate, Event } = require('../model');
const { Op } = require("sequelize");

const pad2 = (n) => String(n).padStart(2, "0");

// 해당 년/월의 마지막 날짜
const getLastDayOfMonth = (year, month) => {
  return new Date(year, month, 0).getDate(); // month: 1~12
};

// 해당 월에 존재하지 않는 날짜면 말일로 보정
const clampDay = (year, month, day) => {
  return Math.min(day, getLastDayOfMonth(year, month));
};

// 원본 Date의 시/분/초/ms 유지하면서 yyyy-mm-dd만 교체
const replaceYMDKeepingTime = (src, year, month, day) => {
  return new Date(
    year,
    month - 1,
    day,
    src.getHours(),
    src.getMinutes(),
    src.getSeconds(),
    src.getMilliseconds()
  );
};

// 월 비교용
const monthSerial = (year, month) => year * 12 + month;

// 겹침 판정
const isOverlapped = (begin, end, rangeStart, rangeEnd) => {
  return begin <= rangeEnd && end >= rangeStart;
};

// 반복 이벤트를 "조회 월 기준 실제 표시용 이벤트"로 변환
const buildRepeatedEventForMonth = (event, targetYear, targetMonth, rangeStart, rangeEnd) => {
  const repeat = event.repeat;
  const originBegin = new Date(event.date_begin);
  const originEnd = new Date(event.date_end);

  // 시작 이후부터만 반복 표시
  if (repeat === "monthly") {
    const originStartSerial = monthSerial(
      originBegin.getFullYear(),
      originBegin.getMonth() + 1
    );
    const targetSerial = monthSerial(targetYear, targetMonth);

    if (targetSerial < originStartSerial) {
      return null;
    }

    const beginDay = clampDay(targetYear, targetMonth, originBegin.getDate());
    const endDay = clampDay(targetYear, targetMonth, originEnd.getDate());

    let nextBegin = replaceYMDKeepingTime(originBegin, targetYear, targetMonth, beginDay);
    let nextEnd = replaceYMDKeepingTime(originEnd, targetYear, targetMonth, endDay);

    // 혹시 보정 과정에서 end < begin 되면 안전하게 맞춤
    if (nextEnd < nextBegin) {
      nextEnd = new Date(nextBegin);
    }

    if (!isOverlapped(nextBegin, nextEnd, rangeStart, rangeEnd)) {
      return null;
    }

    return {
      eventId: event.eventId,
      content: event.content,
      dateBegin: nextBegin,
      dateEnd: nextEnd,
      repeat: event.repeat,
      isDDay: event.isUsedDay === "Y",
      creationTime: event.creationTime,
    };
  }

  if (repeat === "yearly") {
    // 원본 시작년도보다 이전 년도에는 안 보이게
    if (targetYear < originBegin.getFullYear()) {
      return null;
    }

    const beginMonth = originBegin.getMonth() + 1;
    const endMonth = originEnd.getMonth() + 1;

    const beginDay = clampDay(targetYear, beginMonth, originBegin.getDate());
    const endDay = clampDay(targetYear, endMonth, originEnd.getDate());

    let nextBegin = replaceYMDKeepingTime(originBegin, targetYear, beginMonth, beginDay);
    let nextEnd = replaceYMDKeepingTime(originEnd, targetYear, endMonth, endDay);

    if (nextEnd < nextBegin) {
      nextEnd = new Date(nextBegin);
    }

    if (!isOverlapped(nextBegin, nextEnd, rangeStart, rangeEnd)) {
      return null;
    }

    return {
      eventId: event.eventId,
      content: event.content,
      dateBegin: nextBegin,
      dateEnd: nextEnd,
      repeat: event.repeat,
      isDDay: event.isUsedDay === "Y",
      creationTime: event.creationTime,
    };
  }

  return null;
};


// 달력
exports.showCalendar = async (req, res) => {
  try {
    const crewId = req.user.crewId;
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      return res.status(400).json({ message: "달력 정보가 없습니다." });
    }

    // -------------------------
    // Date 조회
    // -------------------------
    const rows = await PlanDate.findAll({
      where: { crewId, year, month },
      attributes: ["day", "isTemporary"],
      order: [["day", "ASC"]],
    });

    const days = {};
    rows.forEach((r) => {
      const dd = pad2(r.day);
      days[dd] = {
        hasPlan: true,
        isTemporary: r.isTemporary === "Y",
      };
    });

    // 조회 월 범위
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    // -------------------------
    // Event 조회
    // -------------------------
    // repeat이 none/null인 건 현재 월과 실제로 겹치는 것만
    // repeat이 monthly/yearly인 건 시작일이 조회 월 말보다 이전인 것만 가져와서
    // 아래에서 "가상 발생일" 계산
    const eventRows = await Event.findAll({
      where: {
        crewId,
        [Op.or]: [
          {
            repeat: { [Op.in]: [null, "none"] },
            date_begin: { [Op.lte]: end },
            date_end: { [Op.gte]: start },
          },
          {
            repeat: { [Op.in]: ["monthly", "yearly"] },
            date_begin: { [Op.lte]: end },
          },
        ],
      },
      attributes: [
        "eventId",
        "content",
        "date_begin",
        "date_end",
        "isUsedDay",
        "repeat",
        "creationTime",
      ],
      order: [["creationTime", "ASC"]],
    });

    const eventList = [];

    for (const e of eventRows) {
      const repeat = e.repeat ?? "none";

      if (repeat === "monthly" || repeat === "yearly") {
        const repeatedEvent = buildRepeatedEventForMonth(
          e,
          year,
          month,
          start,
          end
        );

        if (repeatedEvent) {
          eventList.push(repeatedEvent);
        }
      } else {
        // 반복 아님: 원본 그대로
        eventList.push({
          eventId: e.eventId,
          content: e.content,
          dateBegin: e.date_begin,
          dateEnd: e.date_end,
          repeat: repeat,
          isDDay: e.isUsedDay === "Y",
          creationTime: e.creationTime,
        });
      }
    }

    return res.status(200).json({
      year: String(year),
      month: pad2(month),
      days,
      eventList,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "달력 조회 실패" });
  }
};