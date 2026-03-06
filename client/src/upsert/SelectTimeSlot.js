const DEFAULT_OPTIONS = [
  { value: "slot", label: "Slot" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
  { value: "allday", label: "All Day" },
];

export const SelectTimeSlot = ({
  slot,
  onChange,
  options = DEFAULT_OPTIONS,
}) => {
  return (
    <select
      className="pill pill-label"
      value={slot}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};