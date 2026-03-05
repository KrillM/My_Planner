import { useMemo } from "react";
import EventForm from "./EventForm";

const UpdateEvent = ({ eventId, event, onCancel, onSaved }) => {
  const initialValues = useMemo(() => {
    if (!event) return {};

    const begin = String(event.dateBegin ?? event.date_begin ?? "").slice(0, 10);
    const end = String(event.dateEnd ?? event.date_end ?? "").slice(0, 10) || begin;

    const useDDay = (event.isUseDDay ?? event.isUsedDay ?? event.is_use_dday) === "Y";

    return {
      content: event.content ?? "",
      repeat: event.repeat ?? "none",
      dateBegin: begin,
      dateEnd: end,
      isUseDDay: useDDay,
      slot: begin && end && begin !== end ? "period" : "singleDay",
    };
  }, [event]);

  const handleUpdate = async (form) => {
    const token = localStorage.getItem("token");

    const payload = {
      content: form.content,
      dateBegin: form.dateBegin,
      dateEnd: form.dateEnd,
      isUseDDay: form.isUseDDay,
      repeat: form.repeat,
    };

    const res = await fetch(process.env.REACT_APP_API_BASE_URL + `/event/upsert/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    const ok = res.ok && data.result !== false;
    if (ok) onSaved?.();

    return {
      ok,
      message: data.message ?? (ok ? "수정 완료" : "수정 실패"),
      refresh: ok,
      close: ok,
    };
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(process.env.REACT_APP_API_BASE_URL + `/event/delete/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    const ok = res.ok && data.result;
    if (ok) onSaved?.();

    return {
      ok,
      message: data.message ?? (ok ? "삭제 완료" : "삭제 실패"),
      refresh: ok,
      close: ok,
    };
  };

  return (
    <EventForm
      mode="update"
      initialValues={initialValues}
      onSubmit={handleUpdate}
      onDelete={handleDelete}
      onCancel={onCancel}
    />
  );
};

export default UpdateEvent;