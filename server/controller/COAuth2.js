const { Crew } = require("../model");
const { OAuth2Client } = require("google-auth-library");
const { createCrewId } = require("../static/createCrewId");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

// 중복 없는 crewId 생성
const generateUniqueCrewId = async (loginType) => {
  while (true) {
    const crewId = createCrewId(loginType);

    const exists = await Crew.findOne({
      where: { crewId },
      attributes: ["crewId"],
    });

    if (!exists) return crewId;
  }
};

// OAuth 유저 upsert
const findOrCreateOAuthCrew = async ({
  email,
  nickname,
  profileImage,
  loginType,
}) => {
  const now = new Date();

  let crew = await Crew.findOne({ where: { email } });
  let isCreated = false;

  if (crew) {
    const updateData = {};

    if (crew.loginType !== loginType) {
      updateData.loginType = loginType;
    }

    // 기존 프로필 이미지가 없을 때만 소셜 이미지 반영
    if (!crew.profileImage && profileImage) {
      updateData.profileImage = profileImage;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.modifyTime = now;
      await crew.update(updateData);
      crew = await Crew.findOne({ where: { email } });
      console.log(`[${loginType}] 기존 유저 정보 업데이트 완료: ${email}`);
    } else {
      console.log(`[${loginType}] 변경 사항 없음: ${email}`);
    }
  } else {
    isCreated = true;
    const crewId = await generateUniqueCrewId(loginType);

    crew = await Crew.create({
      crewId,
      email,
      nickname,
      profileImage,
      loginType,
      creationTime: now,
      modifyTime: now,
    });

    console.log(`[${loginType}] 신규 유저 생성 완료: ${email}`);
  }
  return { crew, isCreated };
};

// 서비스 JWT 생성
const createServiceToken = (crewId) => {
  return jwt.sign(
    { crewId },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// 공통 응답
const sendAuthResponse = (res, crew, isCreated) => {
  const token = createServiceToken(crew.crewId);

  return res.status(200).json({
    message: isCreated ? "회원가입 성공" : "로그인 성공",
    token,
    crew: {
      email: crew.email,
      nickname: crew.nickname,
      profileImage: crew.profileImage,
      motto: crew?.motto ?? "",
    },
  });
};

// 에러 로그 공통
const logOAuthError = (label, error) => {
  console.error(`${label} Error:`, {
    message: error.message,
    responseData: error.response?.data,
    stack: error.stack,
  });
};

exports.googleLogin = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "인가 코드가 없습니다." });
  }

  try {
    // 구글 토큰 획득
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // 구글 유저 정보 요청
    const userInfoResponse = await client.request({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
    });

    const { email, name, picture } = userInfoResponse.data;

    if (!email) {
      return res.status(400).json({ message: "구글 이메일 정보를 가져오지 못했습니다." });
    }

    const { crew, isCreated } = await findOrCreateOAuthCrew({
      email,
      nickname: name,
      profileImage: picture,
      loginType: "GOOGLE",
    });

    return sendAuthResponse(res, crew, isCreated);
  } catch (error) {
    logOAuthError("Google Login", error);
    return res.status(500).json({ message: "구글 로그인 실패" });
  }
};

exports.naverLogin = async (req, res) => {
  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({ message: "네이버 인가 정보가 올바르지 않습니다." });
  }

  try {
    // 네이버 access token 요청
    const tokenResponse = await axios.get("https://nid.naver.com/oauth2.0/token", {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code,
        state,
      },
    });

    const naverAccessToken = tokenResponse.data.access_token;

    if (!naverAccessToken) {
      return res.status(400).json({ message: "네이버 액세스 토큰을 가져오지 못했습니다." });
    }

    // 네이버 유저 정보 요청
    const userResponse = await axios.get("https://openapi.naver.com/v1/nid/me", {
      headers: {
        Authorization: `Bearer ${naverAccessToken}`,
      },
    });

    const profile = userResponse.data?.response || {};
    const { email, nickname, profile_image: profileImage } = profile;

    if (!email) {
      return res.status(400).json({ message: "네이버 이메일 정보를 가져오지 못했습니다." });
    }

    const { crew, isCreated } = await findOrCreateOAuthCrew({
      email,
      nickname,
      profileImage,
      loginType: "NAVER",
    });

    return sendAuthResponse(res, crew, isCreated);
  } catch (error) {
    logOAuthError("Naver Login", error);
    return res.status(500).json({ message: "네이버 로그인 실패" });
  }
};