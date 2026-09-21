import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const FilterChip = ({ label, isActive, onClick }: FilterChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "filter-chip min-h-10 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive && "filter-chip-active"
      )}
    >
      {label}
    </button>
  );
};

export default FilterChip;
