const { Crew } = require('../model'); 
const { OAuth2Client } = require('google-auth-library');
const { createCrewId } = require('../static/createCrewId');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage' // 프론트엔드 flow: 'auth-code' 설정과 일치해야 함
);

exports.googleLogin = async (req, res) => {
  const { code } = req.body;

  try {
    // 코드를 이용해 구글 토큰 획득
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // 구글 유저 정보 가져오기
    const userInfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });

    const { sub: googleId, email, name, picture } = userInfo.data;
    const now = new Date();

    // DB 작업 (Upsert: 존재하면 Update, 없으면 Insert)
    let crew = await Crew.findOne({ where: { email: email } });
    let isCreated = false; // 신규 가입인지 확인하기 위한 플래그 선언

    if (crew) {
      // 기존 유저가 있는 경우: 변경 사항이 있는지 체크
      const isChanged = 
        crew.nickname !== name || 
        crew.profileImage !== picture || 
        crew.loginType !== 'GOOGLE';

      if (isChanged) {
        console.log('변경 사항 감지: 정보 업데이트 중...');
        await crew.update({
          nickname: name,
          profileImage: picture,
          modifyTime: now,
          loginType: 'GOOGLE'
        });
      } else {
        console.log('변경 사항 없음 - 구글');
      }
    } else {
      // 이메일이 존재하지 않는다면? -> 신규 생성 (Create)
      isCreated = true;
      let crewId;
      let isCrewIdExists = true;

      while(isCrewIdExists){
        crewId = createCrewId('GOOGLE');

        // DB에서 해당 crewId가 이미 존재하는지 확인
        const checkId = await Crew.findOne({
          where: { crewId: crewId }
        });

        // 검색 결과가 없으면(null이면) 중복되지 않은 것이므로 루프 종료
        if (!checkId) {
          isCrewIdExists = false;
        }
      }

      crew = await Crew.create({
        crewId: crewId,        // 구글의 고유 ID를 PK로 사용
        email: email,
        nickname: name,
        profileImage: picture,
        loginType: 'GOOGLE',
        creationTime: now,
        modifyTime: now,
      });
      console.log('신규 구글 유저 생성 완료:', email);
    }
    // 서비스 전용 JWT 발급
    const accessToken = jwt.sign(
      { crewId: crew.crewId, email: crew.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: isCreated ? '회원가입 성공' : '로그인 성공',
      token: accessToken,
      crew: {
        email: email,
        nickname: name,
        profileImage: picture,
        motto: crew?.motto ?? ""
      }
    });

  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ message: '인증 서버 에러' });
  }
};

exports.naverLogin = async (req, res) => {
  const { code, state } = req.body;
  const now = new Date();

  try {
    // 인가 코드로 접근 토큰(Access Token) 요청
    const tokenResponse = await axios.get(`https://nid.naver.com/oauth2.0/token`, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code: code,
        state: state,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // 접근 토큰으로 네이버 프로필 정보 요청
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { email, nickname, profile_image } = userResponse.data.response;

    // DB 로직 (기존 구글 로직과 동일, createCrewId만 NAVER로!)
    let crew = await Crew.findOne({ where: { email: email } });
    let isCreated = false;

    if (crew) {
      // 기존 유저가 있는 경우: 변경 사항이 있는지 체크
      const isChanged = 
        crew.nickname !== nickname || 
        crew.profileImage !== profile_image || 
        crew.loginType !== 'NAVER';

      if (isChanged) {
        console.log('변경 사항 감지: 정보 업데이트 중...');
        await crew.update({
          nickname: nickname,
          profileImage: profile_image,
          modifyTime: now,
          loginType: 'NAVER'
        });
      } else {
        console.log('변경 사항 없음 - 네이버');
      }
    } else {
      isCreated = true;
      let crewId;
      let isCrewIdExists = true;

      while(isCrewIdExists){
        crewId = createCrewId('NAVER');

        const checkId = await Crew.findOne({
          where: { crewId: crewId }
        });

        if (!checkId) {
          isCrewIdExists = false;
        }
      }

      crew = await Crew.create({
        crewId: crewId,
        email: email,
        nickname: nickname,
        profileImage: profile_image,
        loginType: 'NAVER',
        creationTime: now,
        modifyTime: now,
      });
    }

    // JWT 발급
    const token = jwt.sign(
      { crewId: crew.crewId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      token, message: isCreated ? '회원가입 성공' : '로그인 성공',
      crew: {
        email: email,
        nickname: nickname,
        profileImage: profile_image,
        motto: crew?.motto ?? ""
      }
    });

  } catch (error) {
    console.error('Naver Login Error:', error);
    res.status(500).json({ message: '네이버 로그인 실패' });
  }
};