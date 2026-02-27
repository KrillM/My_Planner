import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddIcon from "../upsert/AddIcon.";
import '../styles/date.scss';

const FrequencyList = () => {
  const navigate = useNavigate();
  const [frequencyList, setFrequencyList] = useState([]);

  useEffect(() => {
    const fetchFrequency = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/frequency/list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setFrequencyList(data.frequencyList ?? []);
      } catch (e) {
        console.error("자주 사용하는 일정 조회 실패:", e);
      }
    };

    fetchFrequency();
  }, []);

  const move = () => {
    navigate("/frequency/new");
  }

  return (
    <div className="date-container">
      <div className="planner-header">
        <h1 className="date-content">Frequency List</h1>
      </div>

      <div className="toDo-list">
        {frequencyList.map((frequency) => (
          <div key={frequency.frequencyId} className="toDo-detail">
            <div className="toDo-content get-pointer"
              onClick={() => navigate(`/frequency/${frequency.frequencyId}`)}
            >
              <div className="content-row">
                {frequency.title}
              </div>
            </div>
            
            <div className="toDo-checkbox get-pointer"
              onClick={() => navigate(`/frequency/upsert/${frequency.frequencyId}`)}
            >
              <span className="material-symbols-outlined">edit</span>
            </div>
          </div>
        ))}
      </div>
      <AddIcon onClick={move}/>
    </div>
  );
};

export default FrequencyList;