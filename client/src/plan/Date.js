import { IoDocumentTextOutline, IoSquareOutline, IoCheckboxOutline, IoNotificationsOutline } from 'react-icons/io5';
import '../styles/date.scss';

const Date = () => {

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
        <IoDocumentTextOutline className="doc-icon"/>
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