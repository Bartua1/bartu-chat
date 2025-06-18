// components/ModelImportList.tsx
import { ModelToImport } from "../types";

interface ModelImportListProps {
  models: ModelToImport[];
  allModels: ModelToImport[];
  onModelsChange: (models: ModelToImport[]) => void;
  isSearching: boolean;
}

export function ModelImportList({ models, allModels, onModelsChange, isSearching }: ModelImportListProps) {
  if (isSearching) {
    return <div className="text-muted-foreground">Searching models...</div>;
  }

  if (allModels.length === 0) {
    return <div className="text-muted-foreground">No models found for this API.</div>;
  }

  if (models.length === 0) {
    return <div className="text-muted-foreground">No models match your search criteria.</div>;
  }

  return (
    <div className="space-y-4">
      {models.map((model) => {
        // Get the original index for state updates
        const originalIndex = allModels.findIndex(m => m.name === model.name);
        return (
          <div key={model.name} className="border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={model.selected}
                onChange={(e) => {
                  onModelsChange(allModels.map((m, i) => 
                    i === originalIndex ? { ...m, selected: e.target.checked } : m
                  ));
                }}
                className="mt-1"
              />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Model ID
                  </label>
                  <div className="text-sm text-muted-foreground">{model.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={model.displayName}
                    onChange={(e) => {
                      onModelsChange(allModels.map((m, i) => 
                        i === originalIndex ? { ...m, displayName: e.target.value } : m
                      ));
                    }}
                    className="w-full p-1 text-sm border border-border rounded bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Input Price ($/M tokens)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={model.inputPrice / 1000000}
                    onChange={(e) => {
                      onModelsChange(allModels.map((m, i) => 
                        i === originalIndex ? { ...m, inputPrice: Math.round(parseFloat(e.target.value) * 1000000) } : m
                      ));
                    }}
                    className="w-full p-1 text-sm border border-border rounded bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Output Price ($/M tokens)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={model.outputPrice / 1000000}
                    onChange={(e) => {
                      onModelsChange(allModels.map((m, i) => 
                        i === originalIndex ? { ...m, outputPrice: Math.round(parseFloat(e.target.value) * 1000000) } : m
                      ));
                    }}
                    className="w-full p-1 text-sm border border-border rounded bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={model.maxTokens ?? ""}
                    onChange={(e) => {
                      onModelsChange(allModels.map((m, i) => 
                        i === originalIndex ? { ...m, maxTokens: e.target.value ? parseInt(e.target.value) : null } : m
                      ));
                    }}
                    className="w-full p-1 text-sm border border-border rounded bg-background text-foreground"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Status
                  </label>
                  <select
                    value={model.isActive}
                    onChange={(e) => {
                      onModelsChange(allModels.map((m, i) => 
                        i === originalIndex ? { ...m, isActive: e.target.value } : m
                      ));
                    }}
                    className="w-full p-1 text-sm border border-border rounded bg-background text-foreground"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}