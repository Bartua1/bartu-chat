// components/ModelsSearch.tsx
interface ModelsSearchProps {
  searchFilter: string;
  onSearchChange: (filter: string) => void;
}

export function ModelsSearch({ searchFilter, onSearchChange }: ModelsSearchProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-foreground mb-2">
        Search Models
      </label>
      <input
        type="text"
        value={searchFilter}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Filter models by name or display name..."
        className="w-full p-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}