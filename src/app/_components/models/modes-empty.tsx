// components/EmptyState.tsx
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface EmptyStateProps {
  onImportClick: () => void;
}

export function EmptyState({ onImportClick }: EmptyStateProps) {
  return (
    <div className="rounded-lg bg-muted/50 border border-dashed border-border p-8 text-center">
      <h3 className="mb-2 text-lg font-semibold text-foreground">No Models Available</h3>
      <p className="text-muted-foreground mb-4">
        Add an API key and import models to get started.
      </p>
      <div className="flex gap-2 justify-center">
        <Link
          href="/settings/api-keys"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" />
          Add API Key
        </Link>
        <button
          onClick={onImportClick}
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/90"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          Import Models
        </button>
      </div>
    </div>
  );
}