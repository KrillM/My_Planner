import { SelectTimeSlot } from "./SelectTimeSlot";
import "../styles/input.scss";
import "../styles/save.scss";

const TodoForm = ({
  slot,
  start,
  end,
  content,
  isUseTimeSlot,
  isContentEmpty,
  isWrongTimeSlot,
  isTimeEmpty,
  isUseAlarm,
  isAllDay,
  timeSlotOptions,
  onSlotChange,
  onStartChange,
  onEndChange,
  onContentChange,
  onToggleAlarm,
  onClose,
  onSubmit,
  submitIcon = "edit",
  closeAriaLabel = "close",
  submitAriaLabel = "submitTodo",
}) => {
  return (
    <form className="input-wrap" onSubmit={onSubmit}>
      <div className="slot-row">
        <SelectTimeSlot
          slot={slot}
          onChange={onSlotChange}
          options={timeSlotOptions}
        />

        {isUseTimeSlot && (
          <div className="time-group">
            <input
              className="pill pill-time"
              type="time"
              value={start}
              onChange={(e) => onStartChange(e.target.value)}
            />

            <span className="tilde">~</span>

            <input
              className="pill pill-time"
              type="time"
              value={end}
              onChange={(e) => onEndChange(e.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          className="close-btn"
          aria-label={closeAriaLabel}
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="content-row">
        <input
          className="content-input"
          value={content}
          placeholder="To Do"
          onChange={(e) => onContentChange(e.target.value)}
        />

        <div className="content-icons">
          {!isAllDay && (
            <button
              type="button"
              className={`icon-btn alert ${isUseAlarm ? "active" : ""}`}
              aria-label="setAlert"
              onClick={onToggleAlarm}
            >
              <span className="material-symbols-outlined">add_alert</span>
            </button>
          )}

          <button
            type="submit"
            className="icon-btn add"
            aria-label={submitAriaLabel}
          >
            <span className="material-symbols-outlined">{submitIcon}</span>
          </button>
        </div>
      </div>

      {isContentEmpty && (
        <p className="warning-message">계획을 입력해주세요.</p>
      )}
      {isWrongTimeSlot && isUseTimeSlot && (
        <p className="warning-message">
          종료시간은 시작시간보다 빠를 수 없습니다.
        </p>
      )}
      {isTimeEmpty && isUseTimeSlot && (
        <p className="warning-message">시작 시간을 입력해주세요.</p>
      )}
    </form>
  );
};

export default TodoForm;