import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InputEvent from "./InputEvent";
import AddIcon from "../upsert/AddIcon.";
import '../styles/date.scss';

const EventList = () => {
  const navigate = useNavigate();
  const [eventList, setEventList] = useState([]);
  const [showInputEvent, setShowInputEvent] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/event/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setEventList(data.eventList ?? []);
    } catch (e) {
      console.error("이벤트 조회 실패:", e);
    }
  };

  const move = () => {
    setShowInputEvent(true);
  }

  return (
    <div className="date-container">
      <div className="planner-header">
        <h1 className="date-content">Event</h1>
      </div>

      <div className="toDo-list">
        {eventList.map((event) => (
          <div key={event.eventId} className="toDo-detail">
            <div className="toDo-content get-pointer">
              <div className="content-row">
                {event.content}
              </div>
            </div>
            
            <div className="toDo-checkbox get-pointer"
              onClick={() => navigate(`/event/upsert/${event.eventId}`)}
            >
              <span className="material-symbols-outlined">edit</span>
            </div>
          </div>
        ))}
      </div>
      {showInputEvent && (
        <InputEvent 
          onCancel={() => {setShowInputEvent(false)}}
          onSaved={() => fetchEvent()} 
        />
      )}
      <AddIcon onClick={move}/>
    </div>
  );
};

export default EventList;