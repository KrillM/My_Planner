const { sequelize, Crew, Frequency, FrequencyMemo, List: FrequencyList } = require('../model');

// 신규 자주 사용하는 일정 생성
const createFrequency = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try{
        const crewId = req.user.crewId;
        const crew = await Crew.findOne({ where: { crewId }, transaction: transaction });
        
        if (!crew) {
            await transaction.rollback();
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
    
        const {title, frequencyList = [], memo} = req.body;
        const now = new Date();
    
        // 일정 생성
        const newFrequency = await Frequency.create(
            {
                crewId,
                title,
                creationTime: now,
                modifyTime: now
            }, {transaction: transaction}
        )
    
        // frequencyId 생성
        const freqId = newFrequency.frequencyId;
    
        // 메모 작성
        await FrequencyMemo.create(
            {
                crewId,
                frequencyId: freqId,
                content: memo,
                creationTime: now,
                modifyTime: now,
            },
            { transaction: transaction }
        );
    
        // 일정 작성
        const lists = frequencyList.map(fList => {
            let planBegin = null;
            let planEnd = null;
            let isUseTimeSlot = "N";
    
        // "HH:MM ~ HH:MM" 케이스
        if (fList.time.includes(":")) {
            isUseTimeSlot = "Y";
    
            const [start, end] = fList.time.split(" ~ ");
    
            planBegin = start;
            planEnd = end || start;
        } 
        // 오전/오후/저녁/밤
        else {
            const map = {
              "오전": "04:00",
              "오후": "12:00",
              "저녁": "18:00",
              "밤": "21:00"
            };
    
            const t = map[fList.time];
            planBegin = t;
            planEnd = planBegin;
        }
    
        return {
                frequencyId: freqId,
                crewId,
                content: fList.content,
                isUseTimeSlot,
                planBegin,
                planEnd,
                isUseAlarm: fList.isUseAlarm ? "Y" : "N",
                creationTime: now,
                modifyTime: now
            };
        });
    
        if (lists.length > 0) {
            await FrequencyList.bulkCreate(lists, { transaction: transaction });
        }
    
        await transaction.commit();
        res.status(201).json({ message: "자주 사용하는 일정이 생성되었습니다.", freqId });
    }
    catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).send({ error: '자주 사용하는 일정 생성 중 오류가 발생했습니다.' });
    }
}

const frequencyList = async (req, res) => {
    try{
        const crewId = req.user.crewId;   
        const lists = await Frequency.findAll({
            where: { crewId },
            order: [["frequencyCount", "DESC"]],
        });
        return res.status(200).json({ frequencyList: lists });
    }
    catch(err){
        console.error(err);
        return res.status(500).json({ message: "자주 사용하는 일정 조회 중 오류" });
    }
}

module.exports = {
    createFrequency,
    frequencyList
}