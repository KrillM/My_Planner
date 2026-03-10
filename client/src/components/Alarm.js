import "../styles/header.scss";

const Alarm = ({ alarms = [] }) => {
  return (
    <div className="alarm-dropdown">
      {alarms.length === 0 ? (
        <div className="alarm-item">
          <p className="alarm-desc">표시할 알림이 없습니다.</p>
        </div>
      ) : (
        alarms.map((alarm, idx) => (
          <div className="alarm-item" key={`${alarm.type}-${alarm.dateKey}-${idx}`}>
            {alarm.type === "event" ? (
              <>
                <p className="alarm-desc">{alarm.message}</p>
                <p className="alarm-title">{alarm.title}</p>
              </>
            ) : (
              <>
                <p className="alarm-dday">{alarm.dday}</p>
                <p className="alarm-title">{alarm.title}</p>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Alarm;