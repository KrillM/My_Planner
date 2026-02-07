import '../styles/date.scss';

const Date = () => {

  // 임시 데이터
  const toDoList = [
    { toDoId: 1, time: '07:00 ~ 07:30', content: '아침 식사', isDone: true },
    { toDoId: 2, time: '08:00 ~ 08:30', content: 'VOC 파악', isDone: true },
    { toDoId: 3, time: '10:00', content: '티 타임', isDone: true },
    { toDoId: 4, time: '12:00 ~ 13:00', content: '점심 식사', isDone: false },
    { toDoId: 5, time: '오후', content: '업무', isDone: false },
    { toDoId: 6, time: '18:00 ~19:00', content: '저녁 식사', isDone: false },
    { toDoId: 7, time: '저녁', content: '코딩 학습', isDone: false, hasIcon: true },
    { toDoId: 8, time: '20:00 ~ 21:00', content: '운동', isDone: false },
  ];

  return (
    <div className="date-container">
      <div className="planner-header">
        <h1 className="date-content">Today</h1>
        <span className="material-symbols-outlined doc-icon">description</span>
      </div>

      <div className="toDo-list">
        {toDoList.map((toDo) => (
          <div key={toDo.toDoId} className="toDo-detail">
            <div className="toDo-content">
              <span className="toDo-time">{toDo.time}</span>
              <div className="content-row">
                <span className="toDo-detail-content">{toDo.content}</span>
                {toDo.hasIcon && <span class="material-symbols-outlined notif-icon">notifications</span>}
              </div>
            </div>
            <div className="toDo-checkbox">
              {toDo.isDone ? (
                <span className="material-symbols-outlined check-icon active">select_check_box</span>
              ) : (
                <span className="material-symbols-outlined check-icon">check_box_outline_blank</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Date;