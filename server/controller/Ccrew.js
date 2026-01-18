const { upload } = require("../multer/multerConfig"); // Multer 설정 파일 import
const { createCrewId } = require('../static/createCrewId');
const { Crew } = require('../model'); 
const bcrypt = require('bcrypt');
const saltLevel = 10;

// 회원가입
const join = async (req, res) => {
    try {
        // Client에서 전송한 데이터 확인
        const {email, nickname, password, motto} = req.body;
        const profileImage = req.file ? req.file.filename : null;

        let crewId;
        let isCrewIdExists = true;

        while(isCrewIdExists){
            crewId = createCrewId('MY_PLANNER');

            // DB에서 해당 crewId가 이미 존재하는지 확인
            const checkId = await Crew.findOne({
                where: { crewId: crewId }
            });

            // 검색 결과가 없으면(null이면) 중복되지 않은 것이므로 루프 종료
            if (!checkId) {
                isCrewIdExists = false;
            }
        }

        // 비밀번호 암호화 (Hashing)
        const hashPassword = await bcrypt.hash(password, saltLevel);

        // 시간 설정
        const now = new Date();

        const newCrewHz = await Crew.create({
            crewId,
            email,
            nickname,
            password: hashPassword,
            motto,
            profileImage: profileImage || null,
            creationTime: now,
            modifyTime: now,
        });

        res.send({ result: true, data: newCrewHz });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: '회원가입 중 오류가 발생했습니다.' });
    }
};

// 이메일 중복 체크
const isEmailDuplicate = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: '잘못된 요청입니다.' });
    }

    const isEmailExist = await Crew.findOne({
      where: {
        email: email,
        loginType: 'MY_PLANNER',
      },
    });

    if (isEmailExist) {
      return res.send({ result: false });
    }

    res.send({ result: true,});
  } catch (error) {
    console.error('중복 확인 중 오류 발생:', error);
    res.status(500).json({ error: '중복 확인 중 오류 발생' });
  }
};

// 로그인

// 회원 정보 수정

// 비밀번호 찾기

// 회원 탈퇴

module.exports = {
    addCrew: [upload.single("profileImage"), join],
    isEmailDuplicate
}