import useTodoForm from "./useTodoForm";
import TodoForm from "./TodoForm";

const UpdateTodo = ({ todo, todoKey, updateTodo, onCancel, timeSlotOptions }) => {
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
  } = useTodoForm(todo);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    updateTodo?.({
      key: todoKey,
      ...buildPayload(),
    });
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
      onClose={onCancel}
      onSubmit={handleSubmit}
      submitIcon="check"
      closeAriaLabel="close"
      submitAriaLabel="updateTodo"
    />
  );
};

export default UpdateTodo;