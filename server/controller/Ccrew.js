const { upload } = require("../multer/multerConfig");
const { createCrewId } = require('../static/createCrewId');
const { Crew } = require('../model'); 
const bcrypt = require('bcrypt');
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
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

    res.send({ result: true });
  } catch (error) {
    console.error('중복 확인 중 오류 발생:', error);
    res.status(500).json({ error: '중복 확인 중 오류 발생' });
  }
};

// 로그인
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const crew = await Crew.findOne({
      where: { email: email }
    });

    if (!crew) {
      return res.status(401).json({ message: "존재하지 않는 사용자입니다." });
    }

    const isMatch = await bcrypt.compare(password, crew.password);
    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    const token = jwt.sign(
      { crewId: crew.crewId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      token: token,
      email: crew.email,
      nickname: crew.nickname
    });

  } catch (error) {
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// 로그아웃
const logout = async (req, res) => {
  try {    
    res.status(200).json({
      success: true,
      message: "성공적으로 로그아웃되었습니다. 토큰을 폐기합니다."
    });
  } catch (error) {
    res.status(500).json({ message: "로그아웃 처리 중 오류 발생" });
  }
};

// 비밀번호 찾기
const findPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const crew = await Crew.findOne({
      where: { email: email }
    });

    if (!crew) {
      return res.status(401).json({ message: "존재하지 않는 사용자입니다." });
    }

    // 유효 시간 지나기 전에 재발급 막기!
    const now = new Date();
    const expires = crew.resetTokenExpires ? new Date(crew.resetTokenExpires) : null;

    if (
      crew.resetPasswordToken &&
      expires &&
      !Number.isNaN(expires.getTime()) &&
      expires > now
    ) {
      const diffSec = Math.ceil((expires.getTime() - now.getTime()) / 1000);

      const msg =
        diffSec >= 60
          ? `${Math.ceil(diffSec / 60)}분 후에 다시 시도하세요.`
          : `${diffSec}초 후에 다시 시도하세요.`;

      return res.status(429).json({ message: `이미 재설정 이메일을 보냈습니다. ${msg}` });
    }

    const crewId = crew.get("crewId");

    // 보안 토큰 생성 (유효기간 1시간)
    const resetPasswordToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);; // 1시간
    
    const [updatedCount] = await Crew.update(
      { resetPasswordToken, resetTokenExpires },
      { where: { crewId } }
    );

    if (updatedCount !== 1) {
      return res.status(500).json({ message: "토큰 저장 실패(대상 불일치)" });
    }

    // 재설정 링크 생성 (프론트엔드 경로)
    const resetUrl = `${process.env.NODE_APP_API_BASE_URL}/resetpassword?token=${resetPasswordToken}`;

    // 이메일 전송 함수 호출 (정의해두신 sendResetEmail 사용)
    await sendResetEmail(crew.email, resetUrl);
    res.json({ message: '비밀번호 재설정 이메일이 발송되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: "서버 오류 발생" });
  }
}

// 메일 발송 함수
const sendResetEmail = async (toEmail, resetLink) => {
  const mailOptions = {
    from: `"My Planner" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '[My Planner] 비밀번호 재설정 링크입니다.',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>비밀번호를 잊으셨나요?</h2>
        <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요. 이 링크는 <strong>1시간 동안</strong> 유효합니다.</p>
        <div style="text-align: left; margin: 30px 0;">
          <a href="${resetLink}" style="padding: 12px 24px; background-color: #c8a2c8; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">비밀번호 재설정하기</a>
        </div>
        <p>만약 본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS 사용 (587 포트의 경우 false)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 비밀번호 수정
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "token / newPassword가 필요합니다." });
  }

  try {
    // 토큰 + 만료시간 체크
    const crew = await Crew.findOne({
      where: {
        resetPasswordToken: token,
        resetTokenExpires: { [require("sequelize").Op.gt]: new Date() },
      },
    });

    if (!crew) {
      return res.status(400).json({ message: "유효하지 않거나 만료된 토큰입니다." });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, saltLevel);

    // 비밀번호 업데이트 + 토큰 초기화(재사용 방지)
    crew.password = hashedPassword;
    crew.resetPasswordToken = null;
    crew.resetTokenExpires = null;
    await crew.save();

    return res.json({ message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 회원 정보 수정

// 회원 탈퇴

module.exports = {
  addCrew: [upload.single("profileImage"), join],
  isEmailDuplicate,
  login,
  logout,
  findPassword,
  sendResetEmail,
  resetPassword
}