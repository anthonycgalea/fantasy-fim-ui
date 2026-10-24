export function YearSelector({
  year,
  onChange,
  label,
}: {
  year: number;
  onChange: (year: number) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={year}
      onChange={(event) => onChange(Number(event.target.value))}
      className="rounded-xl border bg-card px-3 py-2 text-2xl font-extrabold text-foreground outline-none focus:ring-2 focus:ring-ring sm:text-3xl"
    >
      {[2026, 2025].map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
