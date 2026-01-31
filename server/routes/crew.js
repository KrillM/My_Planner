const express = require('express');
const router = express.Router();
const Ccrew = require('../controller/Ccrew');
const auth = require('../middleware/auth');
const { upload } = require('../multer/multerConfig');

// 회원가입
router.post('/join', Ccrew.addCrew);

// 이메일 중복 확인
router.post('/check-email', Ccrew.isEmailDuplicate);

// 로그인
router.post('/login', Ccrew.login);

// 로그아웃
router.post('/logout', Ccrew.logout);

// 비밀번호 찾기
router.post('/findpassword', Ccrew.findPassword);

// 메일 전송
router.post('/sendresetemail', Ccrew.sendResetEmail);

// 비밀번호 수정
router.post('/resetpassword', Ccrew.resetPassword);

// 회원정보 수정
router.post('/editprofile', auth, upload.single("profileImage"), Ccrew.editProfile);

// 회원 탈퇴
router.delete('/leave', auth, Ccrew.leave);

module.exports = router;