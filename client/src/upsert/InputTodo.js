import useTodoForm from "./useTodoForm";
import TodoForm from "./TodoForm";

const InputTodo = ({ addTodo, timeSlotOptions }) => {
  const {
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
    setEnd,
    setIsUseAlarm,
    handleSlotChange,
    handleStartChange,
    handleContentChange,
    validate,
    buildPayload,
    resetForm,
  } = useTodoForm();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    addTodo?.(buildPayload());
    resetForm();
  };

  return (
    <TodoForm
      slot={slot}
      start={start}
      end={end}
      content={content}
      isUseTimeSlot={isUseTimeSlot}
      isContentEmpty={isContentEmpty}
      isWrongTimeSlot={isWrongTimeSlot}
      isTimeEmpty={isTimeEmpty}
      isUseAlarm={isUseAlarm}
      isAllDay={isAllDay}
      timeSlotOptions={timeSlotOptions}
      onSlotChange={handleSlotChange}
      onStartChange={handleStartChange}
      onEndChange={setEnd}
      onContentChange={handleContentChange}
      onToggleAlarm={() => setIsUseAlarm((prev) => !prev)}
      onClose={resetForm}
      onSubmit={handleSubmit}
      submitIcon="edit"
      closeAriaLabel="close"
      submitAriaLabel="addTodo"
    />
  );
};

export default InputTodo;