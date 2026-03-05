import EventForm from "./EventForm";

const InputEvent = ({ onCancel, onSaved }) => {
  const handleCreate = async (form) => {
    const token = localStorage.getItem("token");

    const payload = {
      content: form.content,
      dateBegin: form.dateBegin,
      dateEnd: form.dateEnd,
      isUseDDay: form.isUseDDay,
      repeat: form.repeat,
    };

    const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/event/new", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    const ok = res.ok && data.result !== false;
    if (ok) onSaved?.();

    return {
      ok,
      message: data.message ?? (ok ? "저장 완료" : "저장 실패"),
      refresh: ok,
      close: true,
    };
  };

  return (
    <EventForm
      mode="create"
      initialValues={{}}
      onSubmit={handleCreate}
      onCancel={onCancel}
    />
  );
};

export default InputEvent;