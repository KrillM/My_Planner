const { sequelize, Crew, Event: EventList } = require('../model');

// 이벤트 목록 조회
const eventList = async (req, res) => {
    try{
        const crewId = req.user.crewId;   
        const events = await EventList.findAll({
            where: { crewId },
            order: [["date_begin", "ASC"]],
        });
        return res.status(200).json({ eventList: events });
    }
    catch(err){
        console.error(err);
        return res.status(500).json({ message: "이벤트 조회 중 오류" });
    }
}

// 이벤트 생성
const createEvent = async (req, res) => {
    const transaction = await sequelize.transaction();

    try{
        const crewId = req.user.crewId;
        const crew = await Crew.findOne({ where: { crewId }, transaction: transaction });

        if (!crew) {
            await transaction.rollback();
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const {content, dateBegin, dateEnd, isUseDDay, repeat} = req.body;
        const now = new Date();

        // 이벤트 생성
        const newEvent = await EventList.create(
            {
                crewId,
                content,
                date_begin: dateBegin,
                date_end: dateEnd ? dateEnd : dateBegin,
                isUsedDay: isUseDDay ? "Y" : "N",
                repeat,
                creationTime: now,
                modifyTime: now
            }
            , {transaction: transaction}
        )

        const eventId = newEvent.dateId;

        await transaction.commit();
        return res.status(201).json({ message: "이벤트가 생성 되었습니다.", eventId });
    }
    catch(err){
        await transaction.rollback();
        console.error(err);
        res.status(500).send({ error: '이벤트 생성 중 오류가 발생했습니다.' });
    }
}

// 이벤트 수정
const upsertEvent = async (req, res) => {
    const transaction = await sequelize.transaction();
    try{
        const crewId = req.user.crewId;
        const eventId = Number(req.params.eventId);

        const event = await EventList.findOne({
            where: { crewId, eventId },
            transaction
        });

        if (!event) {
            await transaction.rollback();
            return res.status(404).json({ message: "이벤트가 없습니다." });
        }

        const now = new Date();
        const {content, dateBegin, dateEnd, isUseDDay, repeat} = req.body;

        // 이벤트 수정
        await EventList.update(
            {
                content,
                date_begin: dateBegin,
                date_end: dateEnd ? dateEnd : dateBegin,
                isUsedDay: isUseDDay ? "Y" : "N",
                repeat,
                modifyTime: now
            }
            , {
                where: {crewId, eventId},
                transaction: transaction
            }
        )
        await transaction.commit();
        return res.status(200).json({ result: true, message: "이벤트가 수정되었습니다." });
    }
    catch(err){
        await transaction.rollback();
        console.error(err);
        res.status(500).send({ error: '이벤트 수정 중 오류가 발생했습니다.' });
    }
}

// 이벤트 삭제
const deleteEvent = async (req, res) => {
    try {
        const crewId = req.user.crewId;
        const eventId = Number(req.params.eventId);

        // event 찾기
        const event = await EventList.findOne({
            where: { crewId, eventId },
        });

        if (!event) {
            return res.status(404).json({ message: "이벤트가 없습니다." });
        }

        await EventList.destroy({
            where: { crewId, eventId }
        });

        return res.json({ result: true, message: '이벤트가 삭제되었습니다.' });
    }
    catch(error) {
        console.error('Error deleting crew', error);
        return res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    eventList,
    createEvent,
    upsertEvent,
    deleteEvent
}