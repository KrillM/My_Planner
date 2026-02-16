const { sequelize, Crew, Date: PlanDate, DateMemo, ToDo } = require('../model');

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

        // 일정 존재 여부 확인
        const checkIsDateExist = await PlanDate.findOne({
            where: {crewId, year, month, day},
            transaction: transaction
        })

        if(checkIsDateExist){
            await transaction.rollback();
            return res.status(401).json({ message: "이미 등록된 일정입니다" });
        }

        const now = new Date();

        // 일정 생성
        const newDate = await PlanDate.create(
            {
                crewId,
                year,
                month,
                day,
                isUseDDay: isUseDDay ? "Y" : "N",
                isTemporary: isTemporary ? "Y" : "N",
                creationTime: now,
                modifyTime: now
            }, {transaction: transaction}
        )

        // dateId 생성
        const dateId = newDate.dateId;

        // 메모 작성
        if (memo && memo.trim() !== "") {
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
        }

        // 일정 작성
        const todos = toDoList.map(todo => {
            let planBegin = null;
            let planEnd = null;
            let isUseTimeSlot = "N";

            // "HH:MM ~ HH:MM" 케이스
            if (todo.time.includes(":")) {
                isUseTimeSlot = "Y";

                const [start, end] = todo.time.split(" ~ ");

                planBegin = new Date(`${year}-${month}-${day}T${start}:00`);
                planEnd = new Date(`${year}-${month}-${day}T${end || start}:00`);
            } 
            // 오전/오후/저녁/밤
            else {
                const map = {
                    "오전": "04:00",
                    "오후": "12:00",
                    "저녁": "18:00",
                    "밤": "21:00"
                };

                const t = map[todo.time];
                planBegin = new Date(`${year}-${month}-${day}T${t}:00`);
                planEnd = planBegin;
            }

            return {
                dateId,
                crewId,
                content: todo.content,
                isUseTimeSlot,
                planBegin,
                planEnd,
                isUseAlarm: todo.isUseAlarm ? "Y" : "N",
                isDone: "N",
                creationTime: now,
                modifyTime: now
            };
        });

        if (todos.length > 0) {
            await ToDo.bulkCreate(todos, { transaction: transaction });
        }

        await transaction.commit();
        return res.status(201).json({ message: "일정이 생성되었습니다.", dateId });
    }
    catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).send({ error: '일정 생성 중 오류가 발생했습니다.' });
    }
}

module.exports = {
    createPlan
}