import { useEffect, useState } from "react";

const TIME_LABEL_MAP = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
  night: "밤",
  allday: "Event",
};

const LABEL_SLOT_MAP = {
  오전: "morning",
  오후: "afternoon",
  저녁: "evening",
  밤: "night",
  Event: "allday",
};

export default function useTodoForm(initialTodo = null) {
  const [slot, setSlot] = useState("slot");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [content, setContent] = useState("");
  const [isUseTimeSlot, setIsUseTimeSlot] = useState(true);
  const [isContentEmpty, setIsContentEmpty] = useState(false);
  const [isWrongTimeSlot, setIsWrongTimeSlot] = useState(false);
  const [isTimeEmpty, setIsTimeEmpty] = useState(false);
  const [isUseAlarm, setIsUseAlarm] = useState(false);

  const isAllDay = slot === "allday";

  const resetForm = () => {
    setSlot("slot");
    setIsUseTimeSlot(true);
    setStart("");
    setEnd("");
    setContent("");
    setIsContentEmpty(false);
    setIsWrongTimeSlot(false);
    setIsTimeEmpty(false);
    setIsUseAlarm(false);
  };

  const applyTodo = (todo) => {
    if (!todo) {
      resetForm();
      return;
    }

    setContent(todo.content ?? "");
    setIsUseAlarm(!!todo.isUseAlarm);

    if (todo.slot) {
      setSlot(todo.slot);
      setIsUseTimeSlot(todo.slot === "slot");

      if (todo.slot !== "slot") {
        setStart("");
        setEnd("");
        return;
      }
    }

    const t = todo.time ?? "";

    if (t.includes(":")) {
      setSlot("slot");
      setIsUseTimeSlot(true);

      const [s, e] = t.split(" ~ ").map((v) => v.trim());
      setStart(s || "");
      setEnd(e || "");
    } else if (LABEL_SLOT_MAP[t]) {
      setSlot(LABEL_SLOT_MAP[t]);
      setIsUseTimeSlot(false);
      setStart("");
      setEnd("");
    } else {
      resetForm();
    }

    setIsContentEmpty(false);
    setIsWrongTimeSlot(false);
    setIsTimeEmpty(false);
  };

  useEffect(() => {
    if (initialTodo) {
      applyTodo(initialTodo);
    }
  }, [initialTodo]);

  useEffect(() => {
    setIsWrongTimeSlot(start && end ? start > end : false);
  }, [start, end]);

  const handleSlotChange = (val) => {
    setSlot(val);
    setIsUseTimeSlot(val === "slot");

    if (val === "allday") {
      setIsUseAlarm(false);
    }

    if (val !== "slot") {
      setStart("");
      setEnd("");
      setIsTimeEmpty(false);
    }
  };

  const handleStartChange = (value) => {
    setStart(value);
    if (value !== "") setIsTimeEmpty(false);
  };

  const handleContentChange = (value) => {
    setContent(value);

    if (isContentEmpty && value.trim() !== "") {
      setIsContentEmpty(false);
    }
  };

  const validate = () => {
    const contentEmpty = content.trim() === "";
    const wrongTimeSlot = isUseTimeSlot && end !== "" && start > end;
    const timeEmpty = slot === "slot" && start === "";

    setIsContentEmpty(contentEmpty);
    setIsWrongTimeSlot(wrongTimeSlot);
    setIsTimeEmpty(timeEmpty);

    return !(contentEmpty || wrongTimeSlot || timeEmpty);
  };

  const buildPayload = () => ({
    slot,
    start,
    end,
    content: content.trim(),
    isUseAlarm,
  });

  return {
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
    applyTodo,
    TIME_LABEL_MAP,
  };
}