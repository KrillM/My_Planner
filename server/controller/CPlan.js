const { sequelize, Crew, Date: PlanDate, DateMemo, ToDo, Event } = require('../model');
const { Op } = require("sequelize");

// 신규 일정 생성
const createPlan = async (req, res) => {

  // 트랜잭션 선언
  const transaction = await sequelize.transaction();

  try{
    // 회원 존재 여부 확인
    const crewId = req.user.crewId;
    const crew = await Crew.findOne({ where: { crewId }, transaction: transaction });
    
    if (!crew) {
      await transaction.rollback();
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const {year, month, day, isTemporary, isUseDDay, toDoList = [], memo} = req.body;
    const now = new Date();

    // 일정 생성
    const newDate = await PlanDate.create(
      {
        crewId,
        year,
        month,
        day,
        isUseDDay: isUseDDay ? "Y" : "N",
        isTemporary,
        creationTime: now,
        modifyTime: now
      }, {transaction: transaction}
    )

    // dateId 생성
    const dateId = newDate.dateId;

    // 메모 작성
    await DateMemo.create(
      {
        crewId,
        dateId,
        content: memo,
        creationTime: now,
        modifyTime: now,
      },
      { transaction: transaction }
    );

    // 일정, 이벤트 작성
    const todos = [];
    const events = [];

    for (const todo of toDoList) {
      const timeStr = (todo.time ?? "").trim();

      if (timeStr === "Event") {
        // 이벤트는 날짜 범위로 잡아두는 게 안전함(하루짜리)
        const dateBegin = new Date(`${year}-${month}-${day}T00:00:00`);
        const dateEnd = new Date(`${year}-${month}-${day}T23:59:59`);

        events.push({
          crewId,
          content: todo.content,
          date_begin: dateBegin,
          date_end: dateEnd,
          // PlanDate의 isUseDDay를 Event의 isUsedDay로 반영
          isUsedDay: isUseDDay ? "Y" : "N",
          // repeat는 기본값 NONE이라 생략 가능
          creationTime: now,
          modifyTime: now,
        });

        continue;
      }

      // 나머지는 ToDo로 저장(기존 로직)
      let planBegin = null;
      let planEnd = null;
      let isUseTimeSlot = "N";

      // "HH:MM ~ HH:MM" 케이스
      if (timeStr.includes(":")) {
        isUseTimeSlot = "Y";

        const [start, end] = timeStr.split(" ~ ");
        planBegin = new Date(`${year}-${month}-${day}T${start}:00`);
        planEnd = new Date(`${year}-${month}-${day}T${(end || start)}:00`);
      } else {
        // 오전/오후/저녁/밤
        const map = {
          "오전": "04:00",
          "오후": "12:00",
          "저녁": "18:00",
          "밤": "21:00",
        };

        const t = map[timeStr] ?? "00:00";
        planBegin = new Date(`${year}-${month}-${day}T${t}:00`);
        planEnd = planBegin;
      }

      todos.push({
        dateId,
        crewId,
        content: todo.content,
        isUseTimeSlot,
        planBegin,
        planEnd,
        isUseAlarm: todo.isUseAlarm ? "Y" : "N",
        isDone: "N",
        creationTime: now,
        modifyTime: now,
      });
    }

    if (todos.length > 0) {
      await ToDo.bulkCreate(todos, { transaction: transaction });
    }

    if (events.length > 0) {
      await Event.bulkCreate(events, { transaction });
    }

    await transaction.commit();
    if (isTemporary === "Y") return res.status(201).json({ message: "일정이 임시 저장되었습니다.", dateId });
    else return res.status(201).json({ message: "일정이 생성되었습니다.", dateId });
  }
  catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).send({ error: '일정 생성 중 오류가 발생했습니다.' });
  }
}

// 오늘 일정
const getTodayPlan = async (req, res) => {
  try {
    const crewId = req.user.crewId;
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");

    // date 찾기
    const date = await PlanDate.findOne({
      where: { crewId, year: y, month: m, day: d, isTemporary: "N" },
      order: [["dateId", "DESC"]],
    });

    // 이 날짜의 시작 ~ 종료시간 전부 조회
    const dayStart = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
    const dayEnd = new Date(Number(y), Number(m) - 1, Number(d), 23, 59, 59);

    const events = await Event.findAll({
      where: {
        crewId,
        date_begin: { [Op.lte]: dayEnd },
        date_end: { [Op.gte]: dayStart },
      },
      attributes: ["eventId", "content", "date_begin", "date_end", "isUsedDay", "creationTime"],
      order: [["creationTime", "ASC"]],
    });

    // 이벤트를 프론트가 쓰기 편하게 변환해서 같이 내려줌
    const eventList = events.map((e) => ({
      eventId: e.eventId,
      content: e.content,
    }));

    // date 없으면 빈 데이터 반환
    if (!date) {
      return res.status(200).json({
        date: { year: y, month: m, day: d },
        memo: "",
        toDoList: [],
        eventList
      });
    }
    
    // memo 찾기(있으면)
    const memo = await DateMemo.findOne({
      where: { crewId, dateId: date.dateId },
      order: [["dateMemoId", "DESC"]],
    });

    // todo 리스트 찾기
    const todos = await ToDo.findAll({
      where: { crewId, dateId: date.dateId },
      order: [["planBegin", "ASC"]],
    });
    // 프론트가 쓰기 편하게 변환
    const toDoList = todos.map(t => ({
      toDoId: t.toDoId,
      content: t.content,
      isUseAlarm: t.isUseAlarm === "Y",
      isDone: t.isDone === "Y",
      time: formatTimeLabel(t.isUseTimeSlot, t.planBegin, t.planEnd),
    }));
    return res.status(200).json({
      date: { year: date.year, month: date.month, day: date.day },
      memo: memo?.content ?? "",
      toDoList,
      eventList
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "일정 조회 중 오류" });
  }
};

// 다른 일정
const getPlanByDate = async (req, res) => {
  const { mode } = req.query;

  try {
    const crewId = req.user.crewId;
    const { dateKey } = req.params;

    const y = "20" + dateKey.slice(0,2);
    const m = dateKey.slice(2,4);
    const d = dateKey.slice(4,6);

    // 이 날짜의 시작 ~ 종료시간 전부 조회
    const dayStart = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
    const dayEnd = new Date(Number(y), Number(m) - 1, Number(d), 23, 59, 59);

    // date 찾기
    const date = await PlanDate.findOne({
      where: { crewId, year: y, month: m, day: d },
      order: [["dateId", "DESC"]],
    });

    let eventWhere;

    if (mode === "edit") {
      // UpsertPlan
      eventWhere = {
        crewId,
        date_begin: { [Op.gte]: dayStart },
        date_end: { [Op.lte]: dayEnd },
      };
    } else {
      // PlanDate
      eventWhere = {
        crewId,
        date_begin: { [Op.lte]: dayEnd },
        date_end: { [Op.gte]: dayStart },
      };
    }

    const events = await Event.findAll({
      where: eventWhere,
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

    // date, event 둘 다 없으면 404 처리
    if (!date && events.length === 0) {
      return res.status(404).json({ message: "존재하지 않는 일정입니다." });
    }

    // PlanDate가 있을 때만 memo/todo 조회 (없으면 빈 값)
    let memoContent = "";
    let toDoList = [];
    let isTemporary = "N";
    let isUseDDay = "N";

    if(date){
      isTemporary = date.isTemporary;
      isUseDDay = date.isUseDDay;

      // memo 찾기(있으면)
      const memo = await DateMemo.findOne({
        where: { crewId, dateId: date.dateId },
        order: [["dateMemoId", "DESC"]],
      });

      // todo 리스트 찾기
      const todos = await ToDo.findAll({
        where: { crewId, dateId: date.dateId },
        order: [["planBegin", "ASC"]],
      });

      // 프론트가 쓰기 편하게 변환
      memoContent = memo?.content ?? "";
      toDoList = todos.map(t => ({
        toDoId: t.toDoId,
        content: t.content,
        isUseAlarm: t.isUseAlarm === "Y",
        isDone: t.isDone === "Y",
        time: formatTimeLabel(t.isUseTimeSlot, t.planBegin, t.planEnd),
      }));
    }

    // 이벤트를 프론트가 쓰기 편하게 변환해서 같이 내려줌
    const eventList = events.map((e) => ({
      eventId: e.eventId,
      content: e.content,
    }));

    return res.status(200).json({
      date: { year: y, month: m, day: d },
      isTemporary,
      isUseDDay,
      memo: memoContent,
      toDoList,
      eventList,
      hasPlan: Boolean(date),
      hasEvent: eventList.length > 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "일정 조회 중 오류" });
  }
};

// todo 업데이트
const toDoToggle = async (req, res) => {
  try {
    const { toDoId } = req.params;
    const crewId = req.user.crewId;

    const todo = await ToDo.findOne({ where: { toDoId, crewId } });

    if (!todo) {
      return res.status(404).json({ message: "존재하지 않는 할 일 입니다." });
    }

    const next = todo.isDone === "Y" ? "N" : "Y";

    await todo.update({ isDone: next });

    return res.json({
      result: true,
      isDone: next,
      toDoId: todo.toDoId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "할 일을 수정할 수 없습니다." });
  }
};

// 일정 수정 실행
const upsertPlan = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const crewId = req.user.crewId;
    const { dateKey } = req.params;

    const y = "20" + dateKey.slice(0, 2);
    const m = dateKey.slice(2, 4);
    const d = dateKey.slice(4, 6);

    const dateRow = await PlanDate.findOne({
      where: { crewId, year: y, month: m, day: d },
      order: [["dateId", "DESC"]],
      transaction,
    });

    if (!dateRow) {
      await transaction.rollback();
      return res.status(404).json({ message: "존재하지 않는 일정입니다." });
    }

    const dateId = dateRow.dateId;
    const now = new Date();
    let touched = false;

    const {
      year,
      month,
      day,
      isTemporary,
      isUseDDay,
      toDoList = [],
      memo,
    } = req.body;

    // Date 업데이트
    const patch = {};

    const nextYear = String(year);
    const nextMonth = String(month).padStart(2, "0");
    const nextDay = String(day).padStart(2, "0");
    const nextTemp = isTemporary === "Y" ? "Y" : "N";
    const nextDDay = isUseDDay ? "Y" : "N";

    if (String(dateRow.year) !== nextYear) patch.year = nextYear;
    if (String(dateRow.month).padStart(2, "0") !== nextMonth) patch.month = nextMonth;
    if (String(dateRow.day).padStart(2, "0") !== nextDay) patch.day = nextDay;
    if (dateRow.isTemporary !== nextTemp) patch.isTemporary = nextTemp;
    if (dateRow.isUseDDay !== nextDDay) patch.isUseDDay = nextDDay;

    if (Object.keys(patch).length > 0) {
      patch.modifyTime = now;
      await PlanDate.update(patch, { where: { crewId, dateId }, transaction });
      touched = true;
    }

    // Memo 업데이트
    const memoText = (memo ?? "").trim();

    const memoRow = await DateMemo.findOne({
      where: { crewId, dateId },
      order: [["dateMemoId", "DESC"]],
      transaction,
    });

    if (!memoRow) {
      if (memoText !== "") {
        await DateMemo.create(
          {
            crewId,
            dateId,
            content: memoText,
            creationTime: now,
            modifyTime: now,
          },
          { transaction }
        );
        touched = true;
      }
    } else {
      if ((memoRow.content ?? "").trim() !== memoText) {
        await DateMemo.update(
          { content: memoText, modifyTime: now },
          { where: { dateMemoId: memoRow.dateMemoId }, transaction }
        );
        touched = true;
      }
    }

    // ToDo diff
    const existingTodos = await ToDo.findAll({
      where: { crewId, dateId },
      transaction,
    });

    // 기존 toDo 저장
    const existingMap = new Map(existingTodos.map((t) => [t.toDoId, t]));

    // 신규 toDo 받아옴
    const incoming = Array.isArray(toDoList) ? toDoList : [];

    // incoming id set (기존 것들만)
    const incomingIds = new Set(
      incoming
        .map((t) => Number(t.toDoId))
        .filter((id) => Number.isFinite(id) && id > 0)
    );

    // 3-1) 삭제
    const deleteIds = existingTodos
      .map((t) => t.toDoId)
      .filter((id) => !incomingIds.has(id));

    if (deleteIds.length > 0) {
      await ToDo.destroy({
        where: { crewId, dateId, toDoId: deleteIds },
        transaction,
      });
      touched = true;
    }

    // 시간 파싱
    const parseTodoTime = (todo) => {
      let planBegin = null;
      let planEnd = null;
      let isUseTimeSlot = "N";

      if (todo.time?.includes(":")) {
        isUseTimeSlot = "Y";
        const [start, end] = todo.time.split(" ~ ");
        planBegin = new Date(`${nextYear}-${nextMonth}-${nextDay}T${start}:00`);
        planEnd = new Date(`${nextYear}-${nextMonth}-${nextDay}T${(end || start)}:00`);
      } else {
        const map = { "오전": "04:00", "오후": "12:00", "저녁": "18:00", "밤": "21:00" };
        const t = map[todo.time] || "21:00";
        planBegin = new Date(`${nextYear}-${nextMonth}-${nextDay}T${t}:00`);
        planEnd = planBegin;
      }

      return { planBegin, planEnd, isUseTimeSlot };
    };

    // 3-2) 업데이트/생성
    for (const t of incoming) {
      const id = Number(t.toDoId);
      const { planBegin, planEnd, isUseTimeSlot } = parseTodoTime(t);
      const nextAlarm = t.isUseAlarm ? "Y" : "N";
      const nextDone = t.isDone ? "Y" : "N";

      // 기존이면 비교 후 update
      if (Number.isFinite(id) && id > 0 && existingMap.has(id)) {
        const old = existingMap.get(id);

        const changed =
          (old.content ?? "") !== (t.content ?? "") ||
          old.isUseAlarm !== nextAlarm ||
          old.isDone !== nextDone ||
          old.isUseTimeSlot !== isUseTimeSlot ||
          +new Date(old.planBegin) !== +new Date(planBegin) ||
          +new Date(old.planEnd) !== +new Date(planEnd);

        if (changed) {
          await ToDo.update(
            {
              content: t.content,
              isUseAlarm: nextAlarm,
              isDone: nextDone,
              isUseTimeSlot,
              planBegin,
              planEnd,
              modifyTime: now,
            },
            { where: { crewId, dateId, toDoId: id }, transaction }
          );
          touched = true;
        }
      }
      // 신규면 create (여기서 프론트가 임의 toDoId 만들면 충돌 가능)
      else {
        await ToDo.create(
          {
            dateId,
            crewId,
            content: t.content,
            isUseTimeSlot,
            planBegin,
            planEnd,
            isUseAlarm: nextAlarm,
            isDone: "N",
            creationTime: now,
            modifyTime: now,
          },
          { transaction }
        );
        touched = true;
      }
    }

    // Event diff (singleDay only)
    const incomingEvents = Array.isArray(req.body.eventList) ? req.body.eventList : [];

    // 이 날짜의 singleDay 기준
    const dayStart = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
    const dayEnd   = new Date(Number(y), Number(m) - 1, Number(d), 23, 59, 59);

    // "이 날짜에 속하는 singleDay 이벤트"만 기존으로 잡는다
    const existingEvents = await Event.findAll({
      where: {
        crewId,
        date_begin: { [Op.gte]: dayStart },
        date_end: { [Op.lte]: dayEnd },
      },
      transaction,
    });

    const existingEventMap = new Map(existingEvents.map(e => [e.eventId, e]));

    // incoming 중 "기존 이벤트" id만 추출
    const incomingEventIds = new Set(
      incomingEvents
        .map(e => Number(e.eventId))
        .filter(id => Number.isFinite(id) && id > 0)
    );

    // 1) 삭제: 기존인데 incoming에 없는 애들
    const deleteEventIds = existingEvents
      .map(e => e.eventId)
      .filter(id => !incomingEventIds.has(id));

    if (deleteEventIds.length > 0) {
      await Event.destroy({
        where: { crewId, eventId: deleteEventIds },
        transaction,
      });
      touched = true;
    }

    // 2) 업데이트/생성
    const nextUsedDay = (isUseDDay ? "Y" : "N"); // ✅ 일정의 D-Day를 이벤트에도 동일 적용

    // 기존 날짜 기준
    const oldYear = String(dateRow.year);
    const oldMonth = String(dateRow.month).padStart(2, "0");
    const oldDay = String(dateRow.day).padStart(2, "0");

    // 새 날짜 기준
    const newDayStart = new Date(Number(nextYear), Number(nextMonth) - 1, Number(nextDay), 0, 0, 0);
    const newDayEnd   = new Date(Number(nextYear), Number(nextMonth) - 1, Number(nextDay), 23, 59, 59);

    for (const e of incomingEvents) {
      const id = Number(e.eventId);
      const nextContent = (e.content ?? "").trim();

      // content가 비었으면 스킵(원하면 여기서 validation으로 막아도 됨)
      if (!nextContent) continue;

      // 2-1) 기존 이벤트면 비교 후 update
      if (Number.isFinite(id) && id > 0 && existingEventMap.has(id)) {
        const old = existingEventMap.get(id);

        const changed =
          (old.content ?? "") !== nextContent ||
          old.isUsedDay !== nextUsedDay;

        const isDateChanged =
          oldYear !== nextYear || oldMonth !== nextMonth || oldDay !== nextDay;

        if (changed || isDateChanged) {
          const updatePayload = {
            content: nextContent,
            isUsedDay: nextUsedDay,
            modifyTime: now,
          };

          // 날짜가 바뀌었으면 singleDay 범위도 새 날짜로 이동
          if (isDateChanged) {
            updatePayload.date_begin = newDayStart;
            updatePayload.date_end = newDayEnd;
          }

          await Event.update(
            updatePayload,
            { where: { crewId, eventId: id }, transaction }
          );

          touched = true;
        }
      }
      // 2-2) 신규 이벤트면 create
      else {
        await Event.create(
          {
            crewId,
            content: nextContent,
            date_begin: dayStart,
            date_end: dayEnd,
            repeat: "none",
            isUsedDay: nextUsedDay,
            creationTime: now,
            modifyTime: now,
          },
          { transaction }
        );
        touched = true;
      }
    }

    // 하나라도 바뀌면 Date.modifyTime 갱신 (memo/todo만 바뀐 경우 포함)
    if (touched) {
      await PlanDate.update(
        { modifyTime: now },
        { where: { crewId, dateId }, transaction }
      );
    }

    await transaction.commit();
    if (isTemporary === "Y") return res.status(200).json({ result: true, message: "일정이 임시 저장되었습니다." });
    else return res.status(200).json({ result: true, message: "일정이 수정되었습니다." });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    return res.status(500).json({ message: "일정 수정 중 오류" });
  }
};

// 일정 삭제
const deletePlan = async (req, res) => {
  try{
    const crewId = req.user.crewId;
    const { dateKey } = req.params;

    const y = "20" + dateKey.slice(0,2);
    const m = dateKey.slice(2,4);
    const d = dateKey.slice(4,6);

    // date 찾기
    const date = await PlanDate.findOne({
      where: { crewId, year: y, month: m, day: d },
      order: [["dateId", "DESC"]],
    });

    // date 없으면 빈 데이터 반환
    if (!date) {
      return res.status(404).json({ message: "존재하지 않는 일정입니다." });
    }

    const dateId = date.dateId;
    await PlanDate.destroy({
      where: { dateId, crewId }
    });

    return res.json({ result: true, message: '일정이 삭제되었습니다.' });
  }
  catch(error) {
    console.error('Error deleting crew', error);
    return res.status(500).send('Internal Server Error');
  }
}

// 시간 문자열 만들기: "07:00 ~ 07:30" 또는 "오후" 같은 라벨
function formatTimeLabel(isUseTimeSlot, begin, end) {
  // Sequelize DATE는 JS Date로 들어온다고 가정
  const b = new global.Date(begin);
  const e = new global.Date(end);

  const hhmm = (dt) =>
    `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;

  if (isUseTimeSlot === "Y") {
    const s = hhmm(b);
    const t = hhmm(e);
    return s === t ? s : `${s} ~ ${t}`;
  }

  // 슬롯일 때는 planBegin 시간으로 라벨 복원(네 createPlan에서 맵핑했던 시간 기준)
  const hour = b.getHours();
  if (hour === 4) return "오전";
  if (hour === 12) return "오후";
  if (hour === 18) return "저녁";
  return "밤";
}

module.exports = {
  createPlan,
  getTodayPlan,
  getPlanByDate,
  toDoToggle,
  upsertPlan,
  deletePlan
}