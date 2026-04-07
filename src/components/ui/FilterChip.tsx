import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const FilterChip = ({ label, isActive, onClick }: FilterChipProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "filter-chip",
        isActive && "filter-chip-active"
      )}
    >
      {label}
    </button>
  );
};

export default FilterChip;
