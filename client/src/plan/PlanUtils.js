export const buildTodoTime = ({ slot, start, end }) => {
  if (slot === "slot") return `${start}${end ? ` ~ ${end}` : ""}`;
  if (slot === "morning") return "오전";
  if (slot === "afternoon") return "오후";
  if (slot === "evening") return "저녁";
  return "밤";
};

export const applyTodoUpdate = (prevList, getKey, payload) => {
  const { key, slot, start, end, content, isUseAlarm } = payload;
  const time = buildTodoTime({ slot, start, end });

  return prevList.map((t) =>
    getKey(t) === key ? { ...t, time, content, isUseAlarm, slot } : t
  );
};