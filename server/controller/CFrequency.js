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

// 자주 사용하는 일정 상세 페이지
const frequencyDetail = async (req, res) => {
    try {
        const crewId = req.user.crewId;
        const { frequencyId }= req.params;
        const freqId = Number(frequencyId);

        // frequency 찾기
        const frequency = await Frequency.findOne({
            where: { crewId, frequencyId: freqId },
        });

        if (!frequency) {
            return res.status(404).json({ message: "자주 사용하는 일정이 없습니다." });
        }

        // memo 찾기(있으면)
        const memo = await FrequencyMemo.findOne({
            where: { crewId, frequencyId: freqId }
        });

        // frequency list 리스트 찾기
        const lists = await FrequencyList.findAll({
            where: { crewId, frequencyId: freqId },
            order: [["planBegin", "ASC"]],
        });

        // 프론트가 쓰기 편하게 변환
        const frequencyList = lists.map(t => ({
            listId: t.listId,
            content: t.content,
            isUseAlarm: t.isUseAlarm === "Y",
            time: formatTimeLabel(t.isUseTimeSlot, t.planBegin, t.planEnd),
        }));

        return res.status(200).json({
            title: frequency.title,
            memo: memo?.content ?? "",
            frequencyList,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "자주 사용하는 일정 조회 중 오류" });
    }
};

// 자주 사용하는 일정 삭제
const deleteFrequency = async (req, res) => {
    try {
        const crewId = req.user.crewId;
        const { frequencyId }= req.params;
        const freqId = Number(frequencyId);

        // frequency 찾기
        const frequency = await Frequency.findOne({
            where: { crewId, frequencyId: freqId },
        });

        if (!frequency) {
            return res.status(404).json({ message: "자주 사용하는 일정이 없습니다." });
        }

        await Frequency.destroy({
        where: { crewId, frequencyId: freqId }
    });

        return res.json({ result: true, message: '일정이 삭제되었습니다.' });
    }
    catch(error) {
        console.error('Error deleting crew', error);
        return res.status(500).send('Internal Server Error');
    }
}

// begin/end: "HH:MM:SS" 또는 "HH:MM" or null
function formatTimeLabel(isUseTimeSlot, begin, end) {
    const toHHMM = (t) => {
        if (!t) return null;
        // "07:00:00" -> "07:00"
        const [hh, mm] = String(t).split(":");
        return `${hh.padStart(2, "0")}:${(mm ?? "00").padStart(2, "0")}`;
    };

    const b = toHHMM(begin);
    const e = toHHMM(end) ?? b;

    if (isUseTimeSlot === "Y") {
        if (!b) return "";
        return b === e ? b : `${b} ~ ${e}`;
    }

    // 슬롯 라벨은 begin 시간 기준
    const hour = Number((b ?? "00:00").slice(0, 2));
    if (hour === 4) return "오전";
    if (hour === 12) return "오후";
    if (hour === 18) return "저녁";
    return "밤";
}
module.exports = {
    createFrequency,
    frequencyList,
    frequencyDetail,
    deleteFrequency
}