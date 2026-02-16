const { Crew, Date, DateMemo, ToDo } = require('../model');

// 신규 일정 생성
const createPlan = async (req, res) => {
    try{
        // 회원 존재 여부 확인
        const crewId = req.user.crewId;
        const crew = await Crew.findOne({ where: { crewId } });
        
        if (!crew) {
            return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
        }


    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: '일정 생성 중 오류가 발생했습니다.' });
    }
}

module.exports = {
    createPlan
}