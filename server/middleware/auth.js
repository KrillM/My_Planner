const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization; // "Bearer xxx"
    if (!authHeader) return res.status(401).json({ message: "토큰이 필요합니다." });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "토큰 형식이 올바르지 않습니다." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { crewId: decoded.crewId }; // ✅ 여기서 crewId 세팅

    next();
  } catch (err) {
    return res.status(401).json({ message: "토큰이 유효하지 않습니다." });
  }
};

module.exports = auth;