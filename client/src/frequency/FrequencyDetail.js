import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ModalMemoRead from "../modals/ModalMemoRead";
import UpdateIcon from "../upsert/UpdateIcon";
import '../styles/date.scss';

const FrequencyDetail = () => {
  const navigate = useNavigate();
  const { frequencyId } = useParams();

  const [title, setTitle] = useState("");
  const [frequencyList, setFrequencyList] = useState([]);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(process.env.REACT_APP_API_BASE_URL + `/frequency/${frequencyId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setTitle(data.title ?? "")
        setFrequencyList(data.frequencyList ?? []);        
        setMemo(data.memo ?? "");
      } catch (e) {
        console.error("일정 조회 실패:", e);
      }
    };

    fetchDetail();
  }, []);

  // 메모 useState
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const openMemoModal = () => setIsMemoModalOpen(true);
  const handleCloseMemoModal = () => {
    setIsMemoModalOpen(false);
  };

  // 일정 작성 || 수정 페이지 이동
  const move = () => {

  }

  // 메모 수정
  const handleMemoSave = async (html) => {
    setMemo(html);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + `/memo/frequency/${frequencyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memo: html }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);
    } catch (e) {
      console.error(e);
      alert("메모 저장에 실패했습니다.");
    }
  };

  return (
    <div className="date-container">
      <div className="planner-header">
        <h1 className="date-content">{title}</h1>
          <span
            className="material-symbols-outlined doc-icon"
            onClick={openMemoModal}
          >
            description
          </span>
      </div>

      <div className="toDo-list">
        {frequencyList.map((frequencyList) => (
          <div key={frequencyList.listId} className="toDo-detail">
            <div className="toDo-content">
              <span className="toDo-time">{frequencyList.time}</span>
              <div className="content-row">
                <span className="toDo-content">{frequencyList.content}</span>
                {frequencyList.isUseAlarm && <span className="material-symbols-outlined notif-icon">notifications</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ModalMemoRead
        open={isMemoModalOpen}
        close={handleCloseMemoModal}
        memo={memo}
        onSave={handleMemoSave}
      />
      <UpdateIcon onClick={move}/>
    </div>
  );
};

export default FrequencyDetail;