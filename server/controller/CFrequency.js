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

// 자주 사용하는 일정 수정
const upsertFrequency = async (req, res) => {
    const transaction = await sequelize.transaction();
    try{
        const crewId = req.user.crewId;
        const { frequencyId } = req.params;
        const freqId = Number(frequencyId);

        // frequency 찾기
        const frequency = await Frequency.findOne({
            where: { crewId, frequencyId: freqId },
            transaction
        });

        if (!frequency) {
            await transaction.rollback();
            return res.status(404).json({ message: "자주 사용하는 일정이 없습니다." });
        }

        let touched = false;
        const now = new Date();
        const {title, frequencyList = [], memo} = req.body;

        // Frequency 업데이트
        const patch = {};
        const revisedTitle = String(title);
        if(String(frequency.title) !== revisedTitle) patch.title = revisedTitle;
        if (Object.keys(patch).length > 0) {
            patch.modifyTime = now;
            await Frequency.update(patch, { where: { crewId, frequencyId: freqId }, transaction });
            touched = true;
        }

        // Memo 업데이트
        const memoText = (memo ?? "").trim();
    
        const memoRow = await FrequencyMemo.findOne({
            where: { crewId, frequencyId: freqId },
            transaction,
        });
    
        if ((memoRow.content ?? "").trim() !== memoText) {
            await FrequencyMemo.update(
                { content: memoText, modifyTime: now },
                { where: { frequencyMemoId: memoRow.frequencyMemoId }, transaction }
            );
            touched = true;
        }

        // list diff
        const existLists = await FrequencyList.findAll({
            where: { crewId, frequencyId: freqId },
            transaction,
        });
        
        // 기존 list 저장
        const existingMap = new Map(existLists.map((t) => [t.listId, t]));
    
        // 신규 list 받아옴
        const incoming = Array.isArray(frequencyList) ? frequencyList : [];
        
        // incoming id set (기존 것들만)
        const incomingIds = new Set(
            incoming
            .map((t) => Number(t.listId))
            .filter((id) => Number.isFinite(id) && id > 0)
        );
        
        // 3-1) 삭제
        const deleteIds = existLists
            .map((t) => t.frequencyId)
            .filter((id) => !incomingIds.has(id));
    
        if (deleteIds.length > 0) {
            await FrequencyList.destroy({
                where: { crewId, frequencyId: freqId, listId: deleteIds },
                transaction,
            });
            touched = true;
        }
        
        // 시간 파싱
        const parseTodoTime = (freqList) => {
            let planBegin = null;
            let planEnd = null;
            let isUseTimeSlot = "N";
    
            if (freqList.time?.includes(":")) {
                isUseTimeSlot = "Y";
                const [start, end] = freqList.time.split(" ~ ");
                planBegin = `${start}:00`;
                planEnd = `${(end || start)}:00`;
            } else {
                const map = { "오전": "04:00", "오후": "12:00", "저녁": "18:00", "밤": "21:00" };
                const t = map[freqList.time] || "21:00";
                planBegin = `${t}:00`;
                planEnd = planBegin;
            }
        
            return { planBegin, planEnd, isUseTimeSlot };
        };
    
        // 3-2) 업데이트/생성
        for (const t of incoming) {
            const id = Number(t.listId);
            const { planBegin, planEnd, isUseTimeSlot } = parseTodoTime(t);
            const nextAlarm = t.isUseAlarm ? "Y" : "N";
            const nextDone = t.isDone ? "Y" : "N";
    
            // 기존이면 비교 후 update
            if (Number.isFinite(id) && id > 0 && existingMap.has(id)) {
            const old = existingMap.get(id);
    
            const changed =
                (old.content ?? "") !== (t.content ?? "") ||
                old.isUseAlarm !== nextAlarm ||
                old.isUseTimeSlot !== isUseTimeSlot ||
                +new Date(old.planBegin) !== +new Date(planBegin) ||
                +new Date(old.planEnd) !== +new Date(planEnd);
    
            if (changed) {
                await FrequencyList.update(
                    {
                        content: t.content,
                        isUseAlarm: nextAlarm,
                        isUseTimeSlot,
                        planBegin,
                        planEnd,
                        modifyTime: now,
                    },
                    { where: { crewId, frequencyId: freqId, listId: id }, transaction }
                    );
                    touched = true;
                }
            }
            // 신규면 create
            else {
                await FrequencyList.create(
                    {
                        frequencyId: freqId,
                        crewId,
                        content: t.content,
                        isUseTimeSlot,
                        planBegin,
                        planEnd,
                        isUseAlarm: nextAlarm,
                        creationTime: now,
                        modifyTime: now,
                    },
                    { transaction }
                );
            touched = true;
            }
        }
        
        // 하나라도 바뀌면 modifyTime 갱신
        if (touched) {
            await Frequency.update(
                { modifyTime: now },
                { where: { crewId, frequencyId:freqId }, transaction }
            );
        }

        await transaction.commit();
        return res.status(200).json({ result: true, message: "일정이 수정되었습니다." });
    } catch(err){
        await transaction.rollback();
        console.error(err);
        return res.status(500).json({ message: "일정 수정 중 오류" });   
    }
}

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
    upsertFrequency,
    deleteFrequency
}