import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ModalMemoRead from "../modals/ModalMemoRead";
import ModalMessage from '../modals/ModalMessage';
import UpdateIcon from "../upsert/UpdateIcon";
import CalendarPopover from "../calendar/CalendarPopover";
import '../styles/date.scss';

const FrequencyDetail = () => {
  const navigate = useNavigate();
  const { frequencyId } = useParams();

  const [title, setTitle] = useState("");
  const [frequencyList, setFrequencyList] = useState([]);
  const [memo, setMemo] = useState("");

  // D-Day
  const [isUseDDay, setIsUseDDay] = useState(false);

  // 날짜 설정
  const isDateNotSet = "날짜를 달력에서 선택하세요.";
  const [dateSet, setDateSet] = useState(isDateNotSet);
  const [isDateEmpty, setIsDateEmpty] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const selectedKey = year && month && day ? `${year}-${month}-${day}` : "";

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

  const calBtnRef = useRef(null);
  const [popPos, setPopPos] = useState({ top: 0, right: -5000});
  const margin = 12;

  const calcPos = () => {
    const el = calBtnRef.current;
    if (!el) return null;

    const r = el.getBoundingClientRect();
    let right = window.innerWidth - r.right;
    right = Math.max(margin, right);
    return {
      top: r.bottom + 10,
      right,
    };
  };

  const openCalendar = () => {
    const pos = calcPos();
    if (pos) setPopPos(pos);
    setIsCalendarOpen(v => !v);
  };

  // 바깥 클릭 닫기
  useEffect(() => {
    if (!isCalendarOpen) return;

    const onDown = (e) => {
      // 팝오버 안 클릭은 유지
      const pop = document.querySelector(".cal-popover-fixed");
      if (pop && pop.contains(e.target)) return;

      // 아이콘 클릭도 유지(토글은 openCalendar가 처리)
      if (calBtnRef.current && calBtnRef.current.contains(e.target)) return;

      setIsCalendarOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isCalendarOpen]);

  // 스크롤/리사이즈 시 위치 재계산
  useEffect(() => {
    if (!isCalendarOpen) return;

    const recalc = () => {
      const pos = calcPos();
      if (pos) setPopPos(pos);
    };

    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [isCalendarOpen]);

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

  // 일정 추가
  const handleSubmit = async () => {
    if(dateSet === isDateNotSet){
      setIsDateEmpty(true);
      return;
    }

    const addPlan = {year, month, day, isTemporary: "N", isUseDDay, toDoList: frequencyList, memo};

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/plan/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addPlan),
      });

      const data = await res.json();
      console.log("서버 응답:", data);

      setResultMessage(data.message);
      setIsResultModalOpen(true);
    } catch (err) {
      console.error("전송 실패:", err);
    }
  }

  // 메시지 모달 창
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const handleResultConfirm = () => {
    setIsResultModalOpen(false);
    
    const yy = String(year).slice(-2);
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    
    navigate(`/${yy}${mm}${dd}`, { replace: true });
  };

  return (
    <div className="date-container">
      <div className="planner-header">
        <div className="header-left">
          <div className="header-top">{title}</div>
          <div className="header-pill">
            <span className={`pill-text ${isDateEmpty ? "icon-error" : ""}`}>
              {dateSet}
            </span>
          </div>
        </div>

        <div className="header-right">
          <div 
            className="set-toggle" 
            onClick={() => setIsUseDDay(prev => !prev)}
            style={{
              cursor: "pointer",
              color: isUseDDay ? "#4caf50" : "#bbb"
            }}>
            { isUseDDay ? (
              <span className="material-symbols-outlined">toggle_on</span>) : (
              <span className="material-symbols-outlined">toggle_off</span>
            )}
            D-Day
          </div>
          <span
            ref={calBtnRef}
            className={`material-symbols-outlined ${isDateEmpty ? "icon-error" : ""}`}
            onClick={openCalendar}
            style={{ cursor: "pointer" }}
          >
            calendar_month
          </span>

          {isCalendarOpen && (
            <div
              className="cal-popover-fixed"
              style={{
                top: popPos.top,
                right: popPos.right,
              }}
              >
              <CalendarPopover
                selectedKey={selectedKey}
                canSelect={({ isOutMonth, info }) => !isOutMonth && !info.hasPlan}
                onSelectDate={(d) => {
                  const y = String(d.getFullYear());
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");

                  setYear(y);
                  setMonth(m);
                  setDay(dd);
                  setDateSet(`${y}년 ${m}월 ${dd}일`);
                  setIsDateEmpty(false);
                  setIsCalendarOpen(false);
                }}
                onClose={() => setIsCalendarOpen(false)}
              />
            </div>
          )}
          <span
            className="material-symbols-outlined"
            onClick={openMemoModal}
            style={{ cursor: "pointer" }}
            role="button"
          >
            description
          </span>
          <span 
            className="material-symbols-outlined header-icon"
            onClick={handleSubmit}
          >
            add
          </span>
        </div>
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
      <ModalMessage open={isResultModalOpen} message={resultMessage} onConfirm={handleResultConfirm} />
    </div>
  );
};

export default FrequencyDetail;