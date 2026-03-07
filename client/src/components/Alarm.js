import "../styles/header.scss";

const Alarm = () => {
  return (
    <div className="alarm-dropdown">
      <div className="alarm-item">
        <p className="alarm-desc">10분 뒤 일정이 있습니다.</p>
        <p className="alarm-title">운동</p>
      </div>

      <div className="alarm-item">
        <p className="alarm-dday">D-Day</p>
        <p className="alarm-title">친구 결혼식</p>
      </div>

      <div className="alarm-item">
        <p className="alarm-dday">D-7</p>
        <p className="alarm-title">라그만 먹방</p>
      </div>

      <div className="alarm-item">
        <p className="alarm-dday">D-16</p>
        <p className="alarm-title">가고시마 출발</p>
      </div>
    </div>
  );
};

export default Alarm;