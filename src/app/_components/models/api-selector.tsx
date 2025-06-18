// components/APISelector.tsx
import { UserAPI } from "./model-types";

interface APISelectorProps {
  userAPIs: UserAPI[];
  selectedAPI: number | null;
  onAPIChange: (apiId: number | null) => void;
  isLoading: boolean;
}

export function APISelector({ userAPIs, selectedAPI, onAPIChange, isLoading }: APISelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-foreground mb-2">
        Select API Key
      </label>
      {isLoading ? (
        <div className="text-muted-foreground">Loading APIs...</div>
      ) : (
        <select
          value={selectedAPI ?? ""}
          onChange={(e) => onAPIChange(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
        >
          <option value="">Select an API...</option>
          {userAPIs.map((api) => (
            <option key={api.id} value={api.id}>
              {api.name} ({api.provider})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}