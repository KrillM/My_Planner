export const SelectTimeSlot = ({ slot, onChange }) => {
  return (
    <select
      className="pill pill-label"
      value={slot}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="slot">Slot</option>
      <option value="morning">Morning</option>
      <option value="afternoon">Afternoon</option>
      <option value="evening">Evening</option>
      <option value="night">Night</option>
      <option value="allday">All Day</option>
    </select>
  );
};