import { useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import InputTodo from "../upsert/InputTodo";
import ModalMemoUpsert from "../modals/ModalMemoUpsert";
import ModalMessage from '../modals/ModalMessage';
import UpdateTodo from "../upsert/UpdateTodo";
import { FREQUENCY_TIME_SLOT_OPTIONS } from "../upsert/TimeSlotUtils";
import "../styles/date.scss";

const NewFrequency = () => {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [isTitleEmpty, setIsTitleEmpty] = useState(false);
  const [frequencyList, setFrequencyList] = useState([]);
  const [isFrequencyListNull, setIsFrequencyListNull] = useState(false);
  const [isUpdateInputOpen, setIsUpdateInputOpen] = useState(false);
  const [isButtonClickedWhenUpdateInputButtonOpen, setIsButtonClickedWhenUpdateInputButtonOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [memo, setMemo] = useState("");
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [selectedTodoID, setSelectedTodoID] = useState(null);
  const [createdFrequencyId, setCreatedFrequencyId] = useState("");

  const validateTitle = (value)=> {
    setTitle(value);

    if(isTitleEmpty){
      if(value.trim()!=='')setIsTitleEmpty(false);
    }
  }

  const tempIdRef = useRef(-1);
  const handleAddList = ({ slot, start, end, content, isUseAlarm }) => {
    const time =
      slot === "slot"
        ? `${start}${end ? ` ~ ${end}` : ""}`
        : slot === "morning" ? "오전"
        : slot === "afternoon" ? "오후"
        : slot === "evening" ? "저녁"
        : "밤";

    const newFrequencyList = {
      listId: null,
      tempId: tempIdRef.current--,
      time,
      content,
      isUseAlarm,
    };

    setFrequencyList((prev) => [...prev, newFrequencyList]);
    setIsFrequencyListNull(false);
  };

  const getKey = (t) => t.listId ?? t.tempId;
  const openMemoModal = () => setIsMemoModalOpen(true);

  const handleCloseMemoModal = () => {
    setIsMemoModalOpen(false);
  };

  // 메모 내용 저장
  const handleSaveMemo = (data) => {
    setMemo(data);
    setIsMemoModalOpen(false);
  };

  const showListTodo = (todo) => {
    const k = getKey(todo);
    setSelectedTodoID(prev => (prev === k ? null : k));
    setIsUpdateInputOpen(true);
  }

  const updateList = ({ key, slot, start, end, content, isUseAlarm }) => {
    const time =
      slot === "slot"
        ? `${start}${end ? ` ~ ${end}` : ""}`
        : slot === "morning" ? "오전"
        : slot === "afternoon" ? "오후"
        : slot === "evening" ? "저녁"
        : "밤";

    setFrequencyList(prev =>
      prev.map(t =>
        getKey(t) === key
          ? { ...t, time, content, isUseAlarm, slot }
          : t
      )
    );

    setSelectedTodoID(null);
    setIsUpdateInputOpen(false);
    setIsButtonClickedWhenUpdateInputButtonOpen(false); 
  };

  // List 삭제
  const removeList = (frequencyList) => {
    const k = getKey(frequencyList);
    setFrequencyList(prev => prev.filter(t => getKey(t) !== k));
  }
  
  // 저장
  const handleSubmit = async () => {
    if(frequencyList.length === 0){
      setIsFrequencyListNull(true);
      return;
    }

    if(isUpdateInputOpen){
      setIsButtonClickedWhenUpdateInputButtonOpen(true);
      return;
    }

    const titleEmpty = title.trim() === "";
    setIsTitleEmpty(titleEmpty);

    if(titleEmpty) return;

    const addFrequency = {title, frequencyList, memo};

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/frequency/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addFrequency),
      });

      const data = await res.json();
      console.log("서버 응답:", data);

      setResultMessage(data.message);
      setIsResultModalOpen(true);
      setCreatedFrequencyId(data.freqId);
    } catch (err) {
      console.error("전송 실패:", err);
    }
  }

  const handleResultConfirm = () => {
    setIsResultModalOpen(false);
    navigate(`/frequency/${createdFrequencyId}`, {replace: true});
  };

  return (
    <div className="date-container">
      <div className="planner-header">
        <input
          className="date-title"
          value={title}
          onChange={(e)=>validateTitle(e.target.value)}
          placeholder="Title"
        />
        <div className="doc-icon">
          <span className="material-symbols-outlined" onClick={openMemoModal}>description</span>
        </div>
      </div>

      <div className="toDo-list">
        {frequencyList.map((frequencyList) => (
          <div key={getKey(frequencyList)}>
            {selectedTodoID === getKey(frequencyList) ? (
              <UpdateTodo
                todo={frequencyList}
                todoKey={getKey(frequencyList)}
                updateTodo={updateList}
                onCancel={() => {
                  setSelectedTodoID(null);
                  setIsUpdateInputOpen(false);
                }}
                timeSlotOptions={FREQUENCY_TIME_SLOT_OPTIONS}
              />
            ) : (
              <div className="toDo-detail">
                <div className="toDo-content">
                  <span className="toDo-time">{frequencyList.time}</span>
                  <div className="content-row">
                    <span className="toDo-content">{frequencyList.content}</span>
                    {frequencyList.isUseAlarm && <span className="material-symbols-outlined notif-icon">notifications</span>}
                  </div>
                </div>

                <div className="toDo-checkbox">
                  <span
                    className="material-symbols-outlined toDo-checkbox-detail"
                    onClick={() => showListTodo(frequencyList)}
                  >
                    edit
                  </span>
                  <span 
                    className="material-symbols-outlined toDo-checkbox-detail"
                    onClick={() => removeList(frequencyList)}
                  >
                    delete
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <InputTodo addTodo={handleAddList} timeSlotOptions={FREQUENCY_TIME_SLOT_OPTIONS}/>

      {isFrequencyListNull && (
        <p className="warning-message">
          일정이 존재하지 않습니다. 일정을 등록해주세요.
        </p>
      )}

      {(isUpdateInputOpen && isButtonClickedWhenUpdateInputButtonOpen ) && (
        <p className="warning-message">
          수정 중인 일정이 있으면 저장할 수 없습니다.
        </p>
      )}

      {isTitleEmpty&& (
        <p className="warning-message">
          제목을 입력해주세요.
        </p>
      )}

      <button type="submit" className="save-btn" onClick={handleSubmit}>SAVE</button>

      <ModalMemoUpsert open={isMemoModalOpen} onConfirm={handleCloseMemoModal} onSave={handleSaveMemo} memo={memo}/>
      <ModalMessage open={isResultModalOpen} message={resultMessage} onConfirm={handleResultConfirm} />
    </div>
  );
};

export default NewFrequency;