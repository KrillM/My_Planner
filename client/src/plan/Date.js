import { IoDocumentTextOutline, IoSquareOutline, IoCheckboxOutline, IoNotificationsOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom'; // navigate 추가
import '../styles/date.scss';

const Date = ({setIsLogin}) => {

  const navigate = useNavigate();

  // 임시 로그아웃 함수
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');

      // 1. 서버에 로그아웃 알림 (토큰 수거 요청)
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/crew/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // 현재 토큰 전달
        },
        body: JSON.stringify({}), // 필요한 데이터가 없다면 빈 객체 전송
      });

      // 서버 응답 확인 (필요 시)
      const data = await res.json();
      console.log("서버 응답:", data.message);

      // 2. 클라이언트에서 토큰 소멸 (성공/실패 여부와 상관없이 삭제하는 것이 안전)
      localStorage.removeItem('token');
      
      // 3. 상태 변경 및 페이지 이동
      setIsLogin(false);
      navigate('/');
    } catch (err) {
      console.error("로그아웃 통신 에러:", err);
      // 서버와 연결이 끊겼더라도 클라이언트 토큰은 지워야 합니다.
      localStorage.removeItem('token');
      setIsLogin(false);
      navigate('/');
    }
  };

  // 임시 데이터
  const schedules = [
    { id: 1, time: '07:00 ~ 07:30', title: '아침 식사', completed: true },
    { id: 2, time: '08:00 ~ 08:30', title: 'VOC 파악', completed: true },
    { id: 3, time: '10:00', title: '티 타임', completed: true },
    { id: 4, time: '12:00 ~ 13:00', title: '점심 식사', completed: false },
    { id: 5, time: '오후', title: '업무', completed: false },
    { id: 6, time: '18:00 ~19:00', title: '저녁 식사', completed: false },
    { id: 7, time: '저녁', title: '코딩 학습', completed: false, hasIcon: true },
    { id: 8, time: '20:00 ~ 21:00', title: '운동', completed: false },
  ];

  return (
    <div className="date-container">
      <div className="planner-header">
        <h1 className="date-title">Today</h1>
        {/* 임시 로그아웃 기능 추가 */}
        <IoDocumentTextOutline className="doc-icon" onClick={handleLogout} style={{ cursor: 'pointer' }} />
      </div>

      <div className="schedule-list">
        {schedules.map((item) => (
          <div key={item.id} className="schedule-item">
            <div className="item-content">
              <span className="item-time">{item.time}</span>
              <div className="title-row">
                <span className="item-title">{item.title}</span>
                {item.hasIcon && <IoNotificationsOutline className="notif-icon" />}
              </div>
            </div>
            <div className="item-checkbox">
              {item.completed ? (
                <IoCheckboxOutline className="check-icon active" />
              ) : (
                <IoSquareOutline className="check-icon" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Date;