// components/ImportModelsDialog.tsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { UserAPI, AvailableModel, ModelToImport } from "./model-types";
import { APISelector } from "./api-selector";
import { ModelsSearch } from "./models-search";
import { ModelImportList } from "./model-import-list";

interface ImportModelsDialogProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

export function ImportModelsDialog({ onClose, onImportSuccess }: ImportModelsDialogProps) {
  const [userAPIs, setUserAPIs] = useState<UserAPI[]>([]);
  const [selectedAPI, setSelectedAPI] = useState<number | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [modelsToImport, setModelsToImport] = useState<ModelToImport[]>([]);
  const [isLoadingAPIs, setIsLoadingAPIs] = useState(false);
  const [isSearchingModels, setIsSearchingModels] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Fetch user APIs
  const fetchUserAPIs = async () => {
    setIsLoadingAPIs(true);
    try {
      const response = await fetch("/api/user-apis");
      if (!response.ok) throw new Error("Failed to fetch APIs");
      const apis = await response.json() as UserAPI[];
      setUserAPIs(Array.isArray(apis) ? apis.filter(api => api.isActive === "true") : []);
    } catch (err) {
      console.error("Error fetching APIs:", err);
      setUserAPIs([]);
      toast.error("Failed to load APIs");
    } finally {
      setIsLoadingAPIs(false);
    }
  };

  // Search models from selected API
  const searchModels = async (apiId: number) => {
    setIsSearchingModels(true);
    try {
      const response = await fetch(`/api/user-models/search?apiId=${apiId}`);
      if (!response.ok) throw new Error("Failed to search models");
      const data = await response.json() as { api: UserAPI; models: AvailableModel[] };
      const models = Array.isArray(data.models) ? data.models : [];
      setAvailableModels(models);
      
      // Initialize models to import with default values
      const modelsWithDefaults: ModelToImport[] = models.map(model => ({
        name: model.id,
        provider: model.provider,
        displayName: model.displayName ?? model.id,
        inputPrice: 0,
        outputPrice: 0,
        maxTokens: model.inputTokenLimit ?? null,
        isActive: "true",
        selected: false,
      }));
      setModelsToImport(modelsWithDefaults);
    } catch (err) {
      console.error("Error searching models:", err);
      setAvailableModels([]);
      setModelsToImport([]);
      toast.error("Failed to search models");
    } finally {
      setIsSearchingModels(false);
    }
  };

  // Import selected models
  const importModels = async () => {
    if (!selectedAPI) return;
    
    const selectedModels = modelsToImport.filter(model => model.selected);
    if (selectedModels.length === 0) {
      toast.error("Please select at least one model to import");
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch("/api/user-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiId: selectedAPI,
          models: selectedModels.map(({ selected, ...model }) => model),
        }),
      });

      if (!response.ok) throw new Error("Failed to import models");
      
      const result = await response.json() as { message: string };
      toast.success(result.message);
      onImportSuccess();
    } catch (err) {
      console.error("Error importing models:", err);
      toast.error("Failed to import models");
    } finally {
      setIsImporting(false);
    }
  };

  // Load APIs when dialog opens
  useEffect(() => {
    void fetchUserAPIs();
  }, []);

  // Search models when API is selected
  useEffect(() => {
    if (selectedAPI) {
      void searchModels(selectedAPI);
    }
  }, [selectedAPI]);

  // Filter models based on search term
  const filteredModels = modelsToImport.filter(model => 
    searchFilter === "" || 
    model.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
    model.displayName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-card-foreground">Import Models</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <APISelector
            userAPIs={userAPIs}
            selectedAPI={selectedAPI}
            onAPIChange={setSelectedAPI}
            isLoading={isLoadingAPIs}
          />

          {selectedAPI && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">Available Models</h3>
                {modelsToImport.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setModelsToImport(prev => prev.map(model => ({ ...model, selected: true })));
                      }}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => {
                        setModelsToImport(prev => prev.map(model => ({ ...model, selected: false })));
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>

              {modelsToImport.length > 0 && (
                <ModelsSearch
                  searchFilter={searchFilter}
                  onSearchChange={setSearchFilter}
                />
              )}

              <ModelImportList
                models={filteredModels}
                allModels={modelsToImport}
                onModelsChange={setModelsToImport}
                isSearching={isSearchingModels}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={importModels}
            disabled={!selectedAPI || modelsToImport.filter(m => m.selected).length === 0 || isImporting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? "Importing..." : `Import Selected (${modelsToImport.filter(m => m.selected).length})`}
          </button>
        </div>
      </div>
    </div>
  );
}